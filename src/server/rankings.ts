import { mkdir, unlink, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { createServerFn } from "@tanstack/react-start"
import { and, asc, desc, eq, gt, inArray, lt, ne } from "drizzle-orm"
import sharp from "sharp"
import { z } from "zod"
import { requireAdmin } from "./helpers"
import type { MetricKey, PropertyType, ScoreMap } from "@/lib/rankings"
import { db } from "@/db"
import { property, review, reviewScore } from "@/db/schema"
import {
  METRICS,
  PROPERTY_TYPES,
  formatScore,
  parseScore,
} from "@/lib/rankings"

/** Posters live alongside the database so the Docker volume covers both. */
const ART_DIR = join(dirname(process.env.DB_PATH ?? "data/deablr.db"), "art")
const MAX_ART_BYTES = 10 * 1024 * 1024
const POSTER_WIDTH = 600
const POSTER_RATIO = 2 / 3

/** A Review joined with its Property — the unit the Rankings UI renders. */
export interface RankedReview {
  reviewId: string
  propertyId: string
  title: string
  types: Array<string>
  tags: Array<string>
  artUrl: string
  incomplete: boolean
  /** Defined Scores by Metric, in integer milliunits. */
  scores: ScoreMap
  text: string
}

interface ReviewRow {
  reviewId: string
  propertyId: string
  title: string
  types: Array<string>
  tags: Array<string>
  artPath: string
  incomplete: boolean
  text: string
}

const reviewSelection = {
  reviewId: review.id,
  propertyId: property.id,
  title: property.title,
  types: property.types,
  tags: property.tags,
  artPath: property.artPath,
  incomplete: property.incomplete,
  text: review.text,
}

async function fetchScores(
  reviewIds: Array<string>,
): Promise<Map<string, ScoreMap>> {
  const map = new Map<string, ScoreMap>()
  if (reviewIds.length === 0) return map
  const rows = await db
    .select()
    .from(reviewScore)
    .where(inArray(reviewScore.reviewId, reviewIds))
  for (const row of rows) {
    const scores = map.get(row.reviewId) ?? {}
    scores[row.metric as MetricKey] = row.score
    map.set(row.reviewId, scores)
  }
  return map
}

function toRanked(row: ReviewRow, scores: ScoreMap): RankedReview {
  const { artPath, ...rest } = row
  return { ...rest, artUrl: `/api/art/${artPath}`, scores }
}

/** Public: every Review with its Scores. */
export const listRankings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<RankedReview>> => {
    const rows = await db
      .select(reviewSelection)
      .from(review)
      .innerJoin(property, eq(review.propertyId, property.id))
    const scores = await fetchScores(rows.map((r) => r.reviewId))
    return rows.map((row) => toRanked(row, scores.get(row.reviewId) ?? {}))
  },
)

/** Public: a single Review with its Property and Scores. */
export const getReview = createServerFn({ method: "GET" })
  .inputValidator(z.object({ reviewId: z.string() }))
  .handler(async ({ data }): Promise<RankedReview | null> => {    const rows = await db
      .select(reviewSelection)
      .from(review)
      .innerJoin(property, eq(review.propertyId, property.id))
      .where(eq(review.id, data.reviewId))
      .limit(1)
    const row = rows.at(0)
    if (!row) return null
    const scores = await fetchScores([row.reviewId])
    return toRanked(row, scores.get(row.reviewId) ?? {})
  })

/** Public: every Tag in use, sorted. Powers tag pickers in the UI. */
export const listTags = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<string>> => {
    const rows = await db
      .select({ tags: property.tags })
      .from(property)
    return [...new Set(rows.flatMap((r) => r.tags))].sort()
  },
)

const metricSchema = z.enum(
  METRICS.map((m) => m.key) as [MetricKey, ...Array<MetricKey>],
)

/**
 * Admin: the Reviews holding exactly this Score on the Metric (at most one,
 * since Scores are unique per Metric) plus the 3 Reviews immediately above
 * and 3 immediately below it on that Metric's axis, in display order. Used
 * by the review form's neighbour preview — the exact holder is included so a
 * colliding Score shows the Review it collides with.
 */
export const getScoreNeighbors = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      metric: metricSchema,
      score: z.string(),
      excludeReviewId: z.string().optional(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      above: Array<RankedReview>
      at: Array<RankedReview>
      below: Array<RankedReview>
    }> => {
      await requireAdmin()
      const score = parseScore(data.score)
      if (score === null) return { above: [], at: [], below: [] }
      const exclude = data.excludeReviewId
        ? ne(review.id, data.excludeReviewId)
        : undefined
      // Fresh builder per query: drizzle's builder is mutable and would leak
      // the first query's orderBy into the second.
      const baseQuery = () =>
        db
          .select(reviewSelection)
          .from(reviewScore)
          .innerJoin(review, eq(reviewScore.reviewId, review.id))
          .innerJoin(property, eq(review.propertyId, property.id))
      const aboveRows = await baseQuery()
        .where(
          and(
            eq(reviewScore.metric, data.metric),
            gt(reviewScore.score, score),
            exclude,
          ),
        )
        .orderBy(asc(reviewScore.score))
        .limit(3)
      const atRows = await baseQuery()
        .where(
          and(
            eq(reviewScore.metric, data.metric),
            eq(reviewScore.score, score),
            exclude,
          ),
        )
      const belowRows = await baseQuery()
        .where(
          and(
            eq(reviewScore.metric, data.metric),
            lt(reviewScore.score, score),
            exclude,
          ),
        )
        .orderBy(desc(reviewScore.score))
        .limit(3)
      const scores = await fetchScores(
        [...aboveRows, ...atRows, ...belowRows].map((r) => r.reviewId),
      )
      const toNeighbor = (row: (typeof aboveRows)[number]) =>
        toRanked(row, scores.get(row.reviewId) ?? {})
      return {
        above: aboveRows.reverse().map(toNeighbor),
        at: atRows.map(toNeighbor),
        below: belowRows.map(toNeighbor),
      }
    },
  )

/** Normalizes a comma-separated tag string: trimmed, lowercased, deduped. */
function normalizeTags(raw: string): Array<string> {
  return [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  ]
}

interface ReviewFormData {
  title: string
  types: Array<PropertyType>
  tags: Array<string>
  incomplete: boolean
  scores: ScoreMap
  text: string
}

function parseReviewForm(fd: FormData): ReviewFormData {
  const title = String(fd.get("title") ?? "").trim()
  if (!title) throw new Error("Title is required")

  let types: unknown
  try {
    types = JSON.parse(String(fd.get("types") ?? "[]"))
  } catch {
    throw new Error("Types are invalid")
  }
  if (
    !Array.isArray(types) ||
    types.length === 0 ||
    !types.every((t) => (PROPERTY_TYPES as ReadonlyArray<string>).includes(t))
  ) {
    throw new Error("Select at least one valid Property Type")
  }

  let rawScores: unknown
  try {
    rawScores = JSON.parse(String(fd.get("scores") ?? "{}"))
  } catch {
    throw new Error("Scores are invalid")
  }
  const scores: ScoreMap = {}
  for (const metric of METRICS) {
    const raw = String((rawScores as Record<string, unknown>)[metric.key] ?? "")
    if (raw.trim() === "") continue
    const parsed = parseScore(raw)
    if (parsed === null) {
      throw new Error(
        `${metric.label} score must be a number with up to 3 decimals, 10 or lower`,
      )
    }
    scores[metric.key] = parsed
  }
  if (Object.keys(scores).length === 0) {
    throw new Error("At least one Metric must have a Score")
  }

  const text = String(fd.get("text") ?? "").trim()
  if (!text) throw new Error("Review text is required")

  return {
    title,
    types: types as Array<PropertyType>,
    tags: normalizeTags(String(fd.get("tags") ?? "")),
    incomplete: String(fd.get("incomplete") ?? "false") === "true",
    scores,
    text,
  }
}

function parseArt(fd: FormData, required: boolean): File | null {
  const art = fd.get("art")
  if (!(art instanceof File) || art.size === 0) {
    if (required) throw new Error("Property Art is required")
    return null
  }
  if (!art.type.startsWith("image/")) throw new Error("Art must be an image")
  if (art.size > MAX_ART_BYTES) throw new Error("Art must be under 10 MB")
  return art
}

/** Center-crops to 2:3, shrinks to poster width, encodes as JPEG. */
async function processArt(file: File): Promise<string> {
  const input = Buffer.from(await file.arrayBuffer())
  const { width, height } = await sharp(input).metadata()
  if (!width || !height) throw new Error("Art must be a valid image")

  let cropWidth = width
  let cropHeight = height
  if (width / height > POSTER_RATIO) {
    cropWidth = Math.round(height * POSTER_RATIO)
  } else {
    cropHeight = Math.round(width / POSTER_RATIO)
  }

  const filename = `${crypto.randomUUID()}.jpg`
  const output = await sharp(input)
    .extract({
      left: Math.floor((width - cropWidth) / 2),
      top: Math.floor((height - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight,
    })
    .resize({ width: POSTER_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  await mkdir(ART_DIR, { recursive: true })
  await writeFile(join(ART_DIR, filename), output)
  return filename
}

async function removeArt(filename: string) {
  try {
    await unlink(join(ART_DIR, filename))
  } catch {
    // Already gone — nothing to clean up.
  }
}

/** Throws naming the current holder when a Score is taken on its Metric. */
async function assertScoresFree(scores: ScoreMap, excludeReviewId?: string) {
  for (const [metric, score] of Object.entries(scores)) {
    const rows = await db
      .select({ title: property.title })
      .from(reviewScore)
      .innerJoin(review, eq(reviewScore.reviewId, review.id))
      .innerJoin(property, eq(review.propertyId, property.id))
      .where(
        and(
          eq(reviewScore.metric, metric),
          eq(reviewScore.score, score),
          excludeReviewId ? ne(review.id, excludeReviewId) : undefined,
        ),
      )
      .limit(1)
    const holder = rows.at(0)
    if (holder) {
      const label = METRICS.find((m) => m.key === metric)?.label ?? metric
      throw new Error(
        `${label} score ${formatScore(score)} is already taken by "${holder.title}"`,
      )
    }
  }
}

async function insertScores(reviewId: string, scores: ScoreMap) {
  await db.insert(reviewScore).values(
    Object.entries(scores).map(([metric, score]) => ({
      reviewId,
      metric,
      score,
    })),
  )
}

/** Admin: creates a Property and its Review (with art upload). */
export const createReview = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: fd }): Promise<{ reviewId: string }> => {
    await requireAdmin()
    const fields = parseReviewForm(fd)
    const art = parseArt(fd, true)
    if (!art) throw new Error("Property Art is required")
    await assertScoresFree(fields.scores)

    const artPath = await processArt(art)
    const propertyId = crypto.randomUUID()
    const reviewId = crypto.randomUUID()
    try {
      await db.insert(property).values({
        id: propertyId,
        title: fields.title,
        types: fields.types,
        tags: fields.tags,
        incomplete: fields.incomplete,
        artPath,
      })
      await db.insert(review).values({ id: reviewId, propertyId, text: fields.text })
      await insertScores(reviewId, fields.scores)
    } catch (err) {
      await removeArt(artPath)
      throw err
    }
    return { reviewId }
  })

/** Admin: edits an existing Review/Property; art replaced only if provided. */
export const updateReview = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: fd }) => {
    await requireAdmin()
    const reviewId = String(fd.get("reviewId") ?? "")
    const fields = parseReviewForm(fd)
    const art = parseArt(fd, false)

    const existing = await db
      .select({
        reviewId: review.id,
        propertyId: property.id,
        artPath: property.artPath,
      })
      .from(review)
      .innerJoin(property, eq(review.propertyId, property.id))
      .where(eq(review.id, reviewId))
      .limit(1)
    const current = existing.at(0)
    if (!current) throw new Error("Review not found")

    await assertScoresFree(fields.scores, reviewId)

    let artPath = current.artPath
    if (art) {
      artPath = await processArt(art)
    }
    try {
      await db
        .update(property)
        .set({
          title: fields.title,
          types: fields.types,
          tags: fields.tags,
          incomplete: fields.incomplete,
          artPath,
          updatedAt: new Date(),
        })
        .where(eq(property.id, current.propertyId))
      await db
        .update(review)
        .set({ text: fields.text, updatedAt: new Date() })
        .where(eq(review.id, reviewId))
      await db.delete(reviewScore).where(eq(reviewScore.reviewId, reviewId))
      await insertScores(reviewId, fields.scores)
    } catch (err) {
      if (art) await removeArt(artPath)
      throw err
    }
    if (art && current.artPath !== artPath) await removeArt(current.artPath)
  })

/** Admin: inline quick-edit of a neighbour's Score from the review form. */
export const quickUpdateScore = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      reviewId: z.string(),
      metric: metricSchema,
      score: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const score = parseScore(data.score)
    if (score === null) {
      throw new Error("Score must be a number with up to 3 decimals, 10 or lower")
    }
    await assertScoresFree({ [data.metric]: score }, data.reviewId)
    await db
      .update(reviewScore)
      .set({ score })
      .where(
        and(
          eq(reviewScore.reviewId, data.reviewId),
          eq(reviewScore.metric, data.metric),
        ),
      )
  })

/** Admin: deletes a Review, its Property, and the poster file. */
export const deleteReview = createServerFn({ method: "POST" })
  .inputValidator(z.object({ reviewId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const rows = await db
      .select({ propertyId: property.id, artPath: property.artPath })
      .from(review)
      .innerJoin(property, eq(review.propertyId, property.id))
      .where(eq(review.id, data.reviewId))
      .limit(1)
    const row = rows.at(0)
    if (!row) return
    // Deleting the Property cascades to its Review and Scores.
    await db.delete(property).where(eq(property.id, row.propertyId))
    await removeArt(row.artPath)
  })

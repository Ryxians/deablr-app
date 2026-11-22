import { mkdir, unlink, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { createServerFn } from "@tanstack/react-start"
import { asc, eq, max } from "drizzle-orm"
import sharp from "sharp"
import { z } from "zod"
import { requireAdmin } from "./helpers"
import { db } from "@/db"
import { wishlistItem } from "@/db/schema"
import {
  MAX_COST_CENTS,
  MAX_LINKS,
  MAX_NAME_LENGTH,
  MAX_QUANTITY,
  formatCost,
  normalizeLink,
  parseCost,
} from "@/lib/wishlist"

/** Photos live alongside the database so the Docker volume covers both. */
const PHOTO_DIR = join(
  dirname(process.env.DB_PATH ?? "data/deablr.db"),
  "wishlist"
)
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const PHOTO_SIZE = 800

/** A Wishlist Item as the UI renders it. */
export interface WishlistEntry {
  itemId: string
  name: string
  photoUrl: string | null
  links: Array<string>
  /** Cost of one unit in integer cents; null when unknown. */
  unitCostCents: number | null
  quantity: number
}

function toEntry(row: typeof wishlistItem.$inferSelect): WishlistEntry {
  return {
    itemId: row.id,
    name: row.name,
    photoUrl: row.photoPath ? `/api/wishlist-photo/${row.photoPath}` : null,
    links: row.links,
    unitCostCents: row.unitCostCents,
    quantity: row.quantity,
  }
}

/** Public: every Wishlist Item in Priority order. */
export const listWishlist = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<WishlistEntry>> => {
    const rows = await db
      .select()
      .from(wishlistItem)
      .orderBy(asc(wishlistItem.position), asc(wishlistItem.createdAt))
    return rows.map(toEntry)
  }
)

/** Public: a single Wishlist Item. */
export const getWishlistItem = createServerFn({ method: "GET" })
  .inputValidator(z.object({ itemId: z.string() }))
  .handler(async ({ data }): Promise<WishlistEntry | null> => {
    const rows = await db
      .select()
      .from(wishlistItem)
      .where(eq(wishlistItem.id, data.itemId))
      .limit(1)
    const row = rows.at(0)
    return row ? toEntry(row) : null
  })

interface ItemFormData {
  name: string
  links: Array<string>
  unitCostCents: number | null
  quantity: number
}

function parseItemForm(fd: FormData): ItemFormData {
  const name = String(fd.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Name must be ${MAX_NAME_LENGTH} characters or fewer`)
  }

  let rawLinks: unknown
  try {
    rawLinks = JSON.parse(String(fd.get("links") ?? "[]"))
  } catch {
    throw new Error("Links are invalid")
  }
  if (!Array.isArray(rawLinks)) throw new Error("Links are invalid")
  const links: Array<string> = []
  for (const raw of rawLinks) {
    if (String(raw).trim() === "") continue
    const link = normalizeLink(String(raw))
    if (!link) throw new Error(`"${String(raw)}" is not a valid http(s) link`)
    if (!links.includes(link)) links.push(link)
  }
  if (links.length > MAX_LINKS) {
    throw new Error(`At most ${MAX_LINKS} links per item`)
  }

  const rawCost = String(fd.get("unitCost") ?? "").trim()
  let unitCostCents: number | null = null
  if (rawCost !== "") {
    unitCostCents = parseCost(rawCost)
    if (unitCostCents === null) {
      throw new Error(
        `Cost per unit must be an amount like 12.99, up to ${formatCost(MAX_COST_CENTS)}`
      )
    }
  }

  const quantity = Number(String(fd.get("quantity") ?? "1").trim())
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error(`Quantity must be a whole number from 1 to ${MAX_QUANTITY}`)
  }

  return { name, links, unitCostCents, quantity }
}

function parsePhoto(fd: FormData): File | null {
  const photo = fd.get("photo")
  if (!(photo instanceof File) || photo.size === 0) return null
  if (!photo.type.startsWith("image/"))
    throw new Error("Photo must be an image")
  if (photo.size > MAX_PHOTO_BYTES) throw new Error("Photo must be under 10 MB")
  return photo
}

/**
 * Fits the photo inside an 800px square (no cropping — product shots vary
 * in shape), auto-rotates from EXIF, encodes as JPEG.
 */
async function processPhoto(file: File): Promise<string> {
  const input = Buffer.from(await file.arrayBuffer())
  const { width, height } = await sharp(input).metadata()
  if (!width || !height) throw new Error("Photo must be a valid image")

  const filename = `${crypto.randomUUID()}.jpg`
  const output = await sharp(input)
    .rotate()
    .resize({
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85 })
    .toBuffer()

  await mkdir(PHOTO_DIR, { recursive: true })
  await writeFile(join(PHOTO_DIR, filename), output)
  return filename
}

async function removePhoto(filename: string | null) {
  if (!filename) return
  try {
    await unlink(join(PHOTO_DIR, filename))
  } catch {
    // Already gone — nothing to clean up.
  }
}

async function findRow(itemId: string) {
  const rows = await db
    .select()
    .from(wishlistItem)
    .where(eq(wishlistItem.id, itemId))
    .limit(1)
  return rows.at(0)
}

/** Admin: adds a Wishlist Item at the bottom of the Priority order. */
export const createWishlistItem = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: fd }): Promise<{ itemId: string }> => {
    await requireAdmin()
    const fields = parseItemForm(fd)
    const photo = parsePhoto(fd)
    const photoPath = photo ? await processPhoto(photo) : null
    const itemId = crypto.randomUUID()
    try {
      // One transaction so concurrent creates can't share a position.
      db.transaction((tx) => {
        const { last } = tx
          .select({ last: max(wishlistItem.position) })
          .from(wishlistItem)
          .get() ?? { last: null }
        tx.insert(wishlistItem)
          .values({
            id: itemId,
            ...fields,
            photoPath,
            position: last === null ? 0 : last + 1,
          })
          .run()
      })
    } catch (err) {
      await removePhoto(photoPath)
      throw err
    }
    return { itemId }
  })

/**
 * Admin: edits a Wishlist Item. The photo is replaced only if a new one is
 * provided, and removed when `removePhoto` is "true".
 */
export const updateWishlistItem = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: fd }) => {
    await requireAdmin()
    const itemId = String(fd.get("itemId") ?? "")
    const fields = parseItemForm(fd)
    const photo = parsePhoto(fd)
    const clearPhoto = String(fd.get("removePhoto") ?? "false") === "true"

    const newPhoto = photo ? await processPhoto(photo) : null
    let oldPhoto: string | null
    try {
      // Read and write in one transaction so the photo being replaced is the
      // one actually stored, even if another tab edited or deleted the Item.
      oldPhoto = db.transaction((tx) => {
        const current = tx
          .select({ photoPath: wishlistItem.photoPath })
          .from(wishlistItem)
          .where(eq(wishlistItem.id, itemId))
          .get()
        if (!current) throw new Error("Wishlist item not found")
        const photoPath = newPhoto ?? (clearPhoto ? null : current.photoPath)
        tx.update(wishlistItem)
          .set({ ...fields, photoPath, updatedAt: new Date() })
          .where(eq(wishlistItem.id, itemId))
          .run()
        return photoPath === current.photoPath ? null : current.photoPath
      })
    } catch (err) {
      await removePhoto(newPhoto)
      throw err
    }
    await removePhoto(oldPhoto)
  })

/**
 * Admin: sets the full Priority order. `expectedIds` is the order the client
 * was showing; `itemIds` is the new order (every Item, most wanted first).
 * Rejected if the stored order no longer matches `expectedIds` (another tab
 * reordered, added, or deleted), so a stale page can't undo newer changes.
 * Positions are rewritten densely from 0.
 */
export const reorderWishlist = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      expectedIds: z.array(z.string()),
      itemIds: z.array(z.string()),
    })
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    db.transaction((tx) => {
      const current = tx
        .select({ id: wishlistItem.id })
        .from(wishlistItem)
        .orderBy(asc(wishlistItem.position), asc(wishlistItem.createdAt))
        .all()
        .map((r) => r.id)
      const proposed = new Set(data.itemIds)
      const stale =
        current.length !== data.expectedIds.length ||
        current.some((id, i) => id !== data.expectedIds[i]) ||
        proposed.size !== data.itemIds.length ||
        proposed.size !== current.length ||
        !current.every((id) => proposed.has(id))
      if (stale) {
        throw new Error("The Wishlist changed — refreshed, try again")
      }
      data.itemIds.forEach((id, position) => {
        tx.update(wishlistItem)
          .set({ position })
          .where(eq(wishlistItem.id, id))
          .run()
      })
    })
  })

/** Admin: permanently deletes a Wishlist Item and its photo file. */
export const deleteWishlistItem = createServerFn({ method: "POST" })
  .inputValidator(z.object({ itemId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const current = await findRow(data.itemId)
    if (!current) return
    await db.delete(wishlistItem).where(eq(wishlistItem.id, data.itemId))
    await removePhoto(current.photoPath)
  })

import { mkdir, unlink, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { createServerFn } from "@tanstack/react-start"
import { asc, eq, isNull, max } from "drizzle-orm"
import sharp from "sharp"
import { z } from "zod"
import { requireAdmin } from "./helpers"
import type { Transaction } from "@/db"
import { db } from "@/db"
import { wishlistCategory, wishlistItem } from "@/db/schema"
import {
  MAX_CATEGORY_NAME_LENGTH,
  MAX_COST_CENTS,
  MAX_LINKS,
  MAX_NAME_LENGTH,
  MAX_QUANTITY,
  MISC_CATEGORY_NAME,
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
  /** Null for Misc. */
  categoryId: string | null
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
    categoryId: row.categoryId,
    photoUrl: row.photoPath ? `/api/wishlist-photo/${row.photoPath}` : null,
    links: row.links,
    unitCostCents: row.unitCostCents,
    quantity: row.quantity,
  }
}

/**
 * Public: every Wishlist Item. Position is only meaningful between Items of
 * the same Category; group before displaying.
 */
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
  categoryId: string | null
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

  const categoryId = String(fd.get("categoryId") ?? "") || null

  return { name, categoryId, links, unitCostCents, quantity }
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

/** Rejects a Category deleted since the form was opened. */
function assertCategoryExists(tx: Transaction, categoryId: string | null) {
  if (categoryId === null) return
  const found = tx
    .select({ id: wishlistCategory.id })
    .from(wishlistCategory)
    .where(eq(wishlistCategory.id, categoryId))
    .get()
  if (!found) throw new Error("That category no longer exists")
}

/**
 * A position after every Item's, so one placed there is at the bottom of
 * whichever Category it joins.
 */
function nextItemPosition(tx: Transaction): number {
  const row = tx
    .select({ last: max(wishlistItem.position) })
    .from(wishlistItem)
    .get()
  return (row?.last ?? -1) + 1
}

/** Admin: adds a Wishlist Item at the bottom of its Category. */
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
        assertCategoryExists(tx, fields.categoryId)
        tx.insert(wishlistItem)
          .values({
            id: itemId,
            ...fields,
            photoPath,
            position: nextItemPosition(tx),
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
 * provided, and removed when `removePhoto` is "true". An Item moved to
 * another Category joins the bottom of it.
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
          .select({
            photoPath: wishlistItem.photoPath,
            categoryId: wishlistItem.categoryId,
          })
          .from(wishlistItem)
          .where(eq(wishlistItem.id, itemId))
          .get()
        if (!current) throw new Error("Wishlist item not found")
        assertCategoryExists(tx, fields.categoryId)
        const photoPath = newPhoto ?? (clearPhoto ? null : current.photoPath)
        const moved = fields.categoryId !== current.categoryId
        tx.update(wishlistItem)
          .set({
            ...fields,
            photoPath,
            ...(moved && { position: nextItemPosition(tx) }),
            updatedAt: new Date(),
          })
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

const reorderInput = {
  expectedIds: z.array(z.string()),
  nextIds: z.array(z.string()),
}

/**
 * Throws unless `current` (the stored order) is still what the client was
 * showing and `nextIds` is a permutation of it, so a stale page can't undo
 * newer changes.
 */
function assertFreshOrder(
  current: Array<string>,
  expectedIds: Array<string>,
  nextIds: Array<string>
) {
  const proposed = new Set(nextIds)
  const stale =
    current.length !== expectedIds.length ||
    current.some((id, i) => id !== expectedIds[i]) ||
    proposed.size !== nextIds.length ||
    proposed.size !== current.length ||
    !current.every((id) => proposed.has(id))
  if (stale) {
    throw new Error("The Wishlist changed — refreshed, try again")
  }
}

/** The Items of one Category (null: Misc) in Priority order. */
function itemIdsIn(tx: Transaction, categoryId: string | null): Array<string> {
  return tx
    .select({ id: wishlistItem.id })
    .from(wishlistItem)
    .where(
      categoryId === null
        ? isNull(wishlistItem.categoryId)
        : eq(wishlistItem.categoryId, categoryId)
    )
    .orderBy(asc(wishlistItem.position), asc(wishlistItem.createdAt))
    .all()
    .map((r) => r.id)
}

/**
 * Admin: sets the Priority order within one Category (null: Misc).
 * `expectedIds` is the order the client was showing; `nextIds` is the new
 * order (every Item in that Category, most wanted first). Positions are
 * rewritten densely from 0.
 */
export const reorderWishlist = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ categoryId: z.string().nullable(), ...reorderInput })
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    db.transaction((tx) => {
      assertFreshOrder(
        itemIdsIn(tx, data.categoryId),
        data.expectedIds,
        data.nextIds
      )
      data.nextIds.forEach((id, position) => {
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

/** A Wishlist Category as the UI renders it. */
export interface WishlistCategoryEntry {
  categoryId: string
  name: string
}

/** Public: every Wishlist Category in order. */
export const listWishlistCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<WishlistCategoryEntry>> => {
    return db
      .select({
        categoryId: wishlistCategory.id,
        name: wishlistCategory.name,
      })
      .from(wishlistCategory)
      .orderBy(asc(wishlistCategory.position), asc(wishlistCategory.createdAt))
  }
)

const categoryName = z
  .string()
  .trim()
  .min(1, "Category name is required")
  .max(
    MAX_CATEGORY_NAME_LENGTH,
    `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or fewer`
  )

/**
 * Category names are unique ignoring case, and "Misc" is reserved.
 * `categoryId` is the Category being renamed, which may keep its own name.
 */
function assertNameAvailable(
  tx: Transaction,
  name: string,
  categoryId?: string
) {
  const wanted = name.toLowerCase()
  if (wanted === MISC_CATEGORY_NAME.toLowerCase()) {
    throw new Error(`"${MISC_CATEGORY_NAME}" already holds uncategorized items`)
  }
  const taken = tx
    .select({ id: wishlistCategory.id, name: wishlistCategory.name })
    .from(wishlistCategory)
    .all()
    .some((c) => c.id !== categoryId && c.name.toLowerCase() === wanted)
  if (taken) throw new Error(`There is already a "${name}" category`)
}

/** Admin: adds a Category after the existing ones (still above Misc). */
export const createWishlistCategory = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }): Promise<{ categoryId: string }> => {
    await requireAdmin()
    // Parsed here, not in the validator, so the Admin sees a plain message.
    const parsed = categoryName.safeParse(data.name)
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    const categoryId = crypto.randomUUID()
    db.transaction((tx) => {
      assertNameAvailable(tx, parsed.data)
      const row = tx
        .select({ last: max(wishlistCategory.position) })
        .from(wishlistCategory)
        .get()
      tx.insert(wishlistCategory)
        .values({
          id: categoryId,
          name: parsed.data,
          position: (row?.last ?? -1) + 1,
        })
        .run()
    })
    return { categoryId }
  })

/** Admin: renames a Category. */
export const renameWishlistCategory = createServerFn({ method: "POST" })
  .inputValidator(z.object({ categoryId: z.string(), name: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const parsed = categoryName.safeParse(data.name)
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    db.transaction((tx) => {
      assertCategoryExists(tx, data.categoryId)
      assertNameAvailable(tx, parsed.data, data.categoryId)
      tx.update(wishlistCategory)
        .set({ name: parsed.data })
        .where(eq(wishlistCategory.id, data.categoryId))
        .run()
    })
  })

/** Admin: sets the order of the Categories among themselves. */
export const reorderWishlistCategories = createServerFn({ method: "POST" })
  .inputValidator(z.object(reorderInput))
  .handler(async ({ data }) => {
    await requireAdmin()
    db.transaction((tx) => {
      const current = tx
        .select({ id: wishlistCategory.id })
        .from(wishlistCategory)
        .orderBy(
          asc(wishlistCategory.position),
          asc(wishlistCategory.createdAt)
        )
        .all()
        .map((r) => r.id)
      assertFreshOrder(current, data.expectedIds, data.nextIds)
      data.nextIds.forEach((id, position) => {
        tx.update(wishlistCategory)
          .set({ position })
          .where(eq(wishlistCategory.id, id))
          .run()
      })
    })
  })

/**
 * Admin: deletes a Category. Its Items are not deleted: they join the bottom
 * of Misc, keeping their order.
 */
export const deleteWishlistCategory = createServerFn({ method: "POST" })
  .inputValidator(z.object({ categoryId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    db.transaction((tx) => {
      const first = nextItemPosition(tx)
      itemIdsIn(tx, data.categoryId).forEach((id, i) => {
        tx.update(wishlistItem)
          .set({ categoryId: null, position: first + i })
          .where(eq(wishlistItem.id, id))
          .run()
      })
      tx.delete(wishlistCategory)
        .where(eq(wishlistCategory.id, data.categoryId))
        .run()
    })
  })

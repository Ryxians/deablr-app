import { Link, useRouter } from "@tanstack/react-router"
import {
  ArrowDown,
  ArrowUp,
  ChevronsUp,
  ExternalLink,
  ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react"
import { useRef, useState } from "react"
import type { WishlistCategoryEntry, WishlistEntry } from "@/server/wishlist"
import { FormError } from "@/components/form-bits"
import { ActionButton } from "@/components/wishlist/action-button"
import {
  CategoryHeader,
  NewCategoryForm,
} from "@/components/wishlist/category-controls"
import { Button } from "@/components/ui/button"
import { formatCost, groupByCategory, linkLabel } from "@/lib/wishlist"
import {
  createWishlistCategory,
  deleteWishlistCategory,
  deleteWishlistItem,
  renameWishlistCategory,
  reorderWishlist,
  reorderWishlistCategories,
} from "@/server/wishlist"

/**
 * The Wishlist grouped by Category (Misc last), each in Priority order.
 * Admins get controls to manage Categories and to reorder (top, up, down),
 * edit, and delete Items; everyone else sees the read-only list.
 */
export function WishlistList({
  items,
  categories,
  canManage,
}: {
  items: Array<WishlistEntry>
  categories: Array<WishlistCategoryEntry>
  canManage: boolean
}) {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  // Optimistic order while a reorder round-trips; cleared once the loader
  // has refetched so the server stays the source of truth.
  const [optimisticItems, setOptimisticItems] =
    useState<Array<WishlistEntry> | null>(null)
  const [optimisticCategories, setOptimisticCategories] =
    useState<Array<WishlistCategoryEntry> | null>(null)
  // Buttons stay focusable while a request is in flight (aria-disabled, not
  // disabled) so keyboard focus survives; the ref drops repeat clicks.
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shownItems = optimisticItems ?? items
  const shownCategories = optimisticCategories ?? categories

  /** Focuses an element once the pending DOM changes have landed. */
  function focusSoon(selector: string) {
    requestAnimationFrame(() => {
      rootRef.current?.querySelector<HTMLElement>(selector)?.focus()
    })
  }

  /** Refocuses an action on an Item or Category after its row re-rendered. */
  function refocus(id: string, action: string) {
    focusSoon(`[data-item="${id}"][data-action="${action}"]`)
  }

  /** Runs a mutation, then refetches; resolves true when it succeeded. */
  async function run(
    task: () => Promise<unknown>,
    fallback: string
  ): Promise<boolean> {
    if (busy.current) return false
    busy.current = true
    setPending(true)
    setError(null)
    try {
      await task()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback)
      return false
    } finally {
      await router.invalidate()
      setOptimisticItems(null)
      setOptimisticCategories(null)
      setPending(false)
      busy.current = false
    }
  }

  /** Moves an Item within its Category. */
  async function moveItem(
    categoryId: string | null,
    group: Array<WishlistEntry>,
    from: number,
    to: number,
    action: string
  ) {
    if (busy.current || to < 0 || to >= group.length || to === from) return
    const next = moved(group, from, to)
    const item = group[from]
    // Items elsewhere keep their place: only this Category's order changes.
    const inGroup = new Set(group.map((i) => i.itemId))
    setOptimisticItems([
      ...shownItems.filter((i) => !inGroup.has(i.itemId)),
      ...next,
    ])
    refocus(item.itemId, action)
    await run(
      () =>
        reorderWishlist({
          data: {
            categoryId,
            expectedIds: group.map((i) => i.itemId),
            nextIds: next.map((i) => i.itemId),
          },
        }),
      "Could not reorder"
    )
    refocus(item.itemId, action)
  }

  async function onDeleteItem(group: Array<WishlistEntry>, index: number) {
    const item = group[index]
    if (busy.current) return
    if (!window.confirm(`Permanently delete "${item.name}"?`)) return
    const deleted = await run(
      () => deleteWishlistItem({ data: { itemId: item.itemId } }),
      "Could not delete item"
    )
    if (!deleted) {
      refocus(item.itemId, "delete")
      return
    }
    // Land on the row that took its place (or the new last row) in the same
    // Category, then any other Item; with none left, the New Item action.
    const rest = group.filter((i) => i.itemId !== item.itemId)
    const neighbour =
      rest.at(Math.min(index, rest.length - 1)) ??
      shownItems.find((i) => i.itemId !== item.itemId)
    if (neighbour) refocus(neighbour.itemId, "delete")
    else {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[data-wishlist-new]")?.focus()
      )
    }
  }

  async function moveCategory(from: number, to: number, action: string) {
    if (busy.current || to < 0 || to >= shownCategories.length || to === from) {
      return
    }
    const next = moved(shownCategories, from, to)
    const { categoryId } = shownCategories[from]
    setOptimisticCategories(next)
    refocus(categoryId, action)
    await run(
      () =>
        reorderWishlistCategories({
          data: {
            expectedIds: shownCategories.map((c) => c.categoryId),
            nextIds: next.map((c) => c.categoryId),
          },
        }),
      "Could not reorder categories"
    )
    refocus(categoryId, action)
  }

  async function renameCategory(categoryId: string, name: string) {
    const renamed = await run(
      () => renameWishlistCategory({ data: { categoryId, name } }),
      "Could not rename category"
    )
    if (renamed) refocus(categoryId, "rename")
    return renamed
  }

  async function onDeleteCategory(
    category: WishlistCategoryEntry,
    itemCount: number
  ) {
    if (busy.current) return
    const consequence =
      itemCount === 0
        ? ""
        : ` Its ${itemCount} item${itemCount === 1 ? "" : "s"} will move to Misc.`
    if (
      !window.confirm(`Delete the "${category.name}" category?${consequence}`)
    ) {
      return
    }
    const deleted = await run(
      () =>
        deleteWishlistCategory({ data: { categoryId: category.categoryId } }),
      "Could not delete category"
    )
    if (deleted) focusSoon("[data-wishlist-new-category]")
    else refocus(category.categoryId, "delete")
  }

  const groups = groupByCategory(shownCategories, shownItems)
  // Empty Categories are only worth showing to whoever can fill them.
  const visibleGroups = groups.filter(
    (g) => g.items.length > 0 || (canManage && g.categoryId !== null)
  )
  // With no Categories at all, a lone "Misc" heading would say nothing.
  const headed = shownCategories.length > 0

  const priced = shownItems.filter((i) => i.unitCostCents !== null)
  const grandTotal = priced.reduce(
    (sum, i) => sum + i.unitCostCents! * i.quantity,
    0
  )
  const unpriced = shownItems.length - priced.length

  return (
    <div ref={rootRef} className="space-y-6">
      {canManage && (
        <NewCategoryForm
          pending={pending}
          onCreate={(name) =>
            run(
              () => createWishlistCategory({ data: { name } }),
              "Could not add category"
            )
          }
        />
      )}
      {error && <FormError>{error}</FormError>}
      {visibleGroups.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-16 text-center font-mono text-sm text-muted-foreground">
          Nothing on the wishlist yet.
        </p>
      )}
      {visibleGroups.map((group) => {
        const { categoryId } = group
        const headingId = `wishlist-category-${categoryId ?? "misc"}`
        const categoryIndex = shownCategories.findIndex(
          (c) => c.categoryId === categoryId
        )
        return (
          <section
            key={categoryId ?? "misc"}
            aria-labelledby={headed ? headingId : undefined}
            className="space-y-3"
          >
            {headed && (
              <CategoryHeader
                name={group.name}
                headingId={headingId}
                actions={
                  canManage && categoryId !== null
                    ? {
                        categoryId,
                        index: categoryIndex,
                        count: shownCategories.length,
                        pending,
                        onMove: (to, action) =>
                          void moveCategory(categoryIndex, to, action),
                        onRename: (name) => renameCategory(categoryId, name),
                        onCancelRename: () => refocus(categoryId, "rename"),
                        onDelete: () =>
                          void onDeleteCategory(
                            shownCategories[categoryIndex],
                            group.items.length
                          ),
                      }
                    : undefined
                }
              />
            )}
            {group.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items yet. Pick this category when adding or editing an item.
              </p>
            ) : (
              <ol className="space-y-3">
                {group.items.map((item, index) => (
                  <ItemRow
                    key={item.itemId}
                    item={item}
                    index={index}
                    count={group.items.length}
                    canManage={canManage}
                    pending={pending}
                    onMove={(to, action) =>
                      void moveItem(categoryId, group.items, index, to, action)
                    }
                    onDelete={() => void onDeleteItem(group.items, index)}
                  />
                ))}
              </ol>
            )}
          </section>
        )
      })}
      {priced.length > 0 && (
        <p className="text-right font-mono text-sm">
          <span className="text-muted-foreground">Total </span>
          <span className="text-base font-extrabold tabular-nums">
            {formatCost(grandTotal)}
          </span>
          {unpriced > 0 && (
            <span className="block text-xs text-muted-foreground sm:inline">
              {" "}
              + {unpriced} item{unpriced === 1 ? "" : "s"} with unknown cost
            </span>
          )}
        </p>
      )}
    </div>
  )
}

/** A copy of `list` with the entry at `from` moved to `to`. */
function moved<T>(list: Array<T>, from: number, to: number): Array<T> {
  const next = [...list]
  const [entry] = next.splice(from, 1)
  next.splice(to, 0, entry)
  return next
}

/** One Wishlist Item; `index` and `count` are within its Category. */
function ItemRow({
  item,
  index,
  count,
  canManage,
  pending,
  onMove,
  onDelete,
}: {
  item: WishlistEntry
  index: number
  count: number
  canManage: boolean
  pending: boolean
  onMove: (to: number, action: string) => void
  onDelete: () => void
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:flex-row sm:gap-4 sm:p-4">
      <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
        <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-lg font-extrabold text-secondary tabular-nums sm:w-8">
          <span className="sr-only">Priority </span>
          {index + 1}
        </span>
        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-border/80 sm:size-24">
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.name}
              className="size-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="grid size-full place-content-center bg-well text-muted-foreground">
              <ImageIcon className="size-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="leading-snug font-bold break-words">{item.name}</p>
          <p className="mt-1 font-mono text-sm tabular-nums">
            {item.unitCostCents !== null ? (
              <>
                <span className="font-bold">
                  {formatCost(item.unitCostCents * item.quantity)}
                </span>
                {item.quantity > 1 && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.quantity} × {formatCost(item.unitCostCents)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                Cost unknown
                {item.quantity > 1 && ` · want ${item.quantity}`}
              </span>
            )}
          </p>
          {item.links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 rounded-full bg-secondary/12 px-2.5 py-1 font-mono text-xs font-semibold text-secondary ring-1 ring-secondary/35 outline-none ring-inset hover:bg-secondary/20 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {linkLabel(link)}
                  <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex shrink-0 justify-end gap-1 border-t border-border/60 pt-3 sm:self-start sm:border-0 sm:pt-0">
          <ActionButton
            itemId={item.itemId}
            action="top"
            aria-label={`Move ${item.name} to top`}
            title="Move to top"
            unavailable={pending || index === 0}
            onClick={() => onMove(0, "top")}
          >
            <ChevronsUp />
          </ActionButton>
          <ActionButton
            itemId={item.itemId}
            action="up"
            aria-label={`Move ${item.name} up`}
            title="Move up"
            unavailable={pending || index === 0}
            onClick={() => onMove(index - 1, "up")}
          >
            <ArrowUp />
          </ActionButton>
          <ActionButton
            itemId={item.itemId}
            action="down"
            aria-label={`Move ${item.name} down`}
            title="Move down"
            unavailable={pending || index === count - 1}
            onClick={() => onMove(index + 1, "down")}
          >
            <ArrowDown />
          </ActionButton>
          <Button size="icon-sm" variant="ghost" title="Edit" asChild>
            <Link
              to="/wishlist/$itemId/edit"
              params={{ itemId: item.itemId }}
              aria-label={`Edit ${item.name}`}
            >
              <Pencil />
            </Link>
          </Button>
          <ActionButton
            itemId={item.itemId}
            action="delete"
            variant="ghost-destructive"
            aria-label={`Delete ${item.name}`}
            title="Delete"
            unavailable={pending}
            onClick={() => onDelete()}
          >
            <Trash2 />
          </ActionButton>
        </div>
      )}
    </li>
  )
}

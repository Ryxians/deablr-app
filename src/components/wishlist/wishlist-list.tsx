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
import type { ComponentProps } from "react"
import type { WishlistEntry } from "@/server/wishlist"
import { FormError } from "@/components/form-bits"
import { Button } from "@/components/ui/button"
import { formatCost, linkLabel } from "@/lib/wishlist"
import { cn } from "@/lib/utils"
import { deleteWishlistItem, reorderWishlist } from "@/server/wishlist"

/**
 * The Wishlist in Priority order. Admins get controls to reorder (top, up,
 * down), edit, and delete; everyone else sees the read-only list.
 */
export function WishlistList({
  items,
  canManage,
}: {
  items: Array<WishlistEntry>
  canManage: boolean
}) {
  const router = useRouter()
  const listRef = useRef<HTMLOListElement>(null)
  // Optimistic order while a reorder round-trips; cleared once the loader
  // has refetched so the server stays the source of truth.
  const [optimistic, setOptimistic] = useState<Array<WishlistEntry> | null>(
    null
  )
  // Buttons stay focusable while a request is in flight (aria-disabled, not
  // disabled) so keyboard focus survives; the ref drops repeat clicks.
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shown = optimistic ?? items

  /** Refocuses an action on an Item after its row moved in the DOM. */
  function refocus(itemId: string, action: string) {
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(
          `[data-item="${itemId}"][data-action="${action}"]`
        )
        ?.focus()
    })
  }

  /** Runs a mutation, then refetches; resolves true when it succeeded. */
  async function run(
    task: () => Promise<void>,
    fallback: string
  ): Promise<boolean> {
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
      setOptimistic(null)
      setPending(false)
      busy.current = false
    }
  }

  async function move(from: number, to: number, action: string) {
    if (busy.current || to < 0 || to >= shown.length || to === from) return
    const expectedIds = shown.map((i) => i.itemId)
    const next = [...shown]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOptimistic(next)
    refocus(moved.itemId, action)
    await run(
      () =>
        reorderWishlist({
          data: { expectedIds, itemIds: next.map((i) => i.itemId) },
        }),
      "Could not reorder"
    )
    refocus(moved.itemId, action)
  }

  async function onDelete(index: number) {
    const item = shown[index]
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
    // Land on the row that took its place (or the new last row); with the
    // list now empty, fall back to the New Item action.
    const rest = shown.filter((i) => i.itemId !== item.itemId)
    const neighbour = rest.at(Math.min(index, rest.length - 1))
    if (neighbour) refocus(neighbour.itemId, "delete")
    else {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[data-wishlist-new]")?.focus()
      )
    }
  }

  if (shown.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-16 text-center font-mono text-sm text-muted-foreground">
        Nothing on the wishlist yet.
      </p>
    )
  }

  const priced = shown.filter((i) => i.unitCostCents !== null)
  const grandTotal = priced.reduce(
    (sum, i) => sum + i.unitCostCents! * i.quantity,
    0
  )
  const unpriced = shown.length - priced.length

  return (
    <div className="space-y-4">
      {error && <FormError>{error}</FormError>}
      <ol ref={listRef} className="space-y-3">
        {shown.map((item, index) => (
          <li
            key={item.itemId}
            className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:flex-row sm:gap-4 sm:p-4"
          >
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
                <p className="leading-snug font-bold break-words">
                  {item.name}
                </p>
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
                  onClick={() => void move(index, 0, "top")}
                >
                  <ChevronsUp />
                </ActionButton>
                <ActionButton
                  itemId={item.itemId}
                  action="up"
                  aria-label={`Move ${item.name} up`}
                  title="Move up"
                  unavailable={pending || index === 0}
                  onClick={() => void move(index, index - 1, "up")}
                >
                  <ArrowUp />
                </ActionButton>
                <ActionButton
                  itemId={item.itemId}
                  action="down"
                  aria-label={`Move ${item.name} down`}
                  title="Move down"
                  unavailable={pending || index === shown.length - 1}
                  onClick={() => void move(index, index + 1, "down")}
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
                  onClick={() => void onDelete(index)}
                >
                  <Trash2 />
                </ActionButton>
              </div>
            )}
          </li>
        ))}
      </ol>
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

/**
 * A row action that stays focusable when unavailable: `unavailable` sets
 * aria-disabled (and dims it) instead of `disabled`, which would drop
 * keyboard focus to <body>. The click handler must no-op in that state.
 */
function ActionButton({
  itemId,
  action,
  unavailable,
  variant = "ghost",
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button> & {
  itemId: string
  action: string
  unavailable: boolean
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={variant}
      data-item={itemId}
      data-action={action}
      aria-disabled={unavailable || undefined}
      className={cn(
        "aria-disabled:cursor-default aria-disabled:opacity-50",
        className
      )}
      onClick={unavailable ? undefined : onClick}
      {...props}
    />
  )
}

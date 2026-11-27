import {
  ArrowDown,
  ArrowUp,
  ChevronsUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { ActionButton } from "@/components/wishlist/action-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MAX_CATEGORY_NAME_LENGTH } from "@/lib/wishlist"

/** The Admin field that adds a Category. */
export function NewCategoryForm({
  pending,
  onCreate,
}: {
  pending: boolean
  /** Resolves true when the Category was created. */
  onCreate: (name: string) => Promise<boolean>
}) {
  const [name, setName] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (await onCreate(name)) setName("")
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm gap-2">
      <Input
        aria-label="New category name"
        data-wishlist-new-category
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New category, e.g. Kitchen"
        maxLength={MAX_CATEGORY_NAME_LENGTH}
      />
      <Button type="submit" variant="outline" disabled={pending}>
        <Plus />
        Add
      </Button>
    </form>
  )
}

/** Admin actions for a Category; Misc has none. */
export interface CategoryActions {
  categoryId: string
  index: number
  count: number
  pending: boolean
  onMove: (to: number, action: string) => void
  /** Resolves true when the rename was saved. */
  onRename: (name: string) => Promise<boolean>
  onCancelRename: () => void
  onDelete: () => void
}

export function CategoryHeader({
  name,
  headingId,
  actions,
}: {
  name: string
  headingId: string
  actions?: CategoryActions
}) {
  const [draft, setDraft] = useState<string | null>(null)

  function cancel() {
    setDraft(null)
    actions?.onCancelRename()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!actions || draft === null) return
    if (draft.trim() === name) cancel()
    else if (await actions.onRename(draft)) setDraft(null)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
      {/* Stays in the DOM while renaming: it labels the section. */}
      <h2
        id={headingId}
        className={
          draft === null
            ? "min-w-0 font-mono text-base font-extrabold break-words md:text-lg"
            : "sr-only"
        }
      >
        {name}
      </h2>
      {actions && draft !== null ? (
        <form onSubmit={onSubmit} className="flex w-full max-w-sm gap-2">
          <Input
            aria-label={`Rename ${name}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel()
            }}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            autoFocus
            required
          />
          <Button type="submit" disabled={actions.pending}>
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        </form>
      ) : (
        actions && (
          <div className="ml-auto flex shrink-0 gap-1">
            <ActionButton
              itemId={actions.categoryId}
              action="top"
              aria-label={`Move ${name} category to top`}
              title="Move category to top"
              unavailable={actions.pending || actions.index === 0}
              onClick={() => actions.onMove(0, "top")}
            >
              <ChevronsUp />
            </ActionButton>
            <ActionButton
              itemId={actions.categoryId}
              action="up"
              aria-label={`Move ${name} category up`}
              title="Move category up"
              unavailable={actions.pending || actions.index === 0}
              onClick={() => actions.onMove(actions.index - 1, "up")}
            >
              <ArrowUp />
            </ActionButton>
            <ActionButton
              itemId={actions.categoryId}
              action="down"
              aria-label={`Move ${name} category down`}
              title="Move category down"
              unavailable={
                actions.pending || actions.index === actions.count - 1
              }
              onClick={() => actions.onMove(actions.index + 1, "down")}
            >
              <ArrowDown />
            </ActionButton>
            <ActionButton
              itemId={actions.categoryId}
              action="rename"
              aria-label={`Rename ${name} category`}
              title="Rename category"
              unavailable={actions.pending}
              onClick={() => setDraft(name)}
            >
              <Pencil />
            </ActionButton>
            <ActionButton
              itemId={actions.categoryId}
              action="delete"
              variant="ghost-destructive"
              aria-label={`Delete ${name} category`}
              title="Delete category"
              unavailable={actions.pending}
              onClick={actions.onDelete}
            >
              <Trash2 />
            </ActionButton>
          </div>
        )
      )}
    </div>
  )
}

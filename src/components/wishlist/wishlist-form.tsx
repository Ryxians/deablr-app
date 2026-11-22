import { useNavigate } from "@tanstack/react-router"
import { ImageIcon, Plus, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { WishlistEntry } from "@/server/wishlist"
import { FormError } from "@/components/form-bits"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MAX_NAME_LENGTH,
  MAX_QUANTITY,
  costInputValue,
  formatCost,
  parseCost,
} from "@/lib/wishlist"
import { cn } from "@/lib/utils"
import { createWishlistItem, updateWishlistItem } from "@/server/wishlist"

/** The Admin form for creating and editing a Wishlist Item. */
export function WishlistForm({ initial }: { initial?: WishlistEntry }) {
  const navigate = useNavigate()
  const [name, setName] = useState(initial?.name ?? "")
  const [links, setLinks] = useState<Array<string>>(initial?.links ?? [])
  const [unitCost, setUnitCost] = useState(
    costInputValue(initial?.unitCostCents ?? null)
  )
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1))
  const photoInput = useRef<HTMLInputElement>(null)
  // A newly chosen file (and its blob preview) takes precedence; otherwise
  // the saved photo shows unless the Admin marked it for removal.
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const savedPhoto = removePhoto ? null : (initial?.photoUrl ?? null)
  const photoPreview = photoFile ? fileUrl : savedPhoto
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!photoFile) return
    const url = URL.createObjectURL(photoFile)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const unitCents = parseCost(unitCost)
  const qty = Number(quantity)
  const total =
    unitCents !== null && Number.isInteger(qty) && qty >= 1
      ? unitCents * qty
      : null

  function setLink(index: number, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? value : l)))
  }

  /**
   * Discards a newly chosen file (back to the saved photo, if any), or —
   * with no new file pending — marks the saved photo for removal on save.
   */
  function onClearPhoto() {
    if (photoInput.current) photoInput.current.value = ""
    if (photoFile) setPhotoFile(null)
    else setRemovePhoto(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const fd = new FormData()
    fd.set("name", name)
    fd.set("links", JSON.stringify(links))
    fd.set("unitCost", unitCost)
    fd.set("quantity", quantity)
    if (photoFile) fd.set("photo", photoFile)
    else if (removePhoto) fd.set("removePhoto", "true")

    setPending(true)
    try {
      if (initial) {
        fd.set("itemId", initial.itemId)
        await updateWishlistItem({ data: fd })
      } else {
        await createWishlistItem({ data: fd })
      }
      await navigate({ to: "/wishlist" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save item")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <FormSection title="The basics">
        <Field label="Name" htmlFor="wish-name">
          <Input
            id="wish-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mechanical keyboard"
            maxLength={MAX_NAME_LENGTH}
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <Field
            label="Cost per unit ($)"
            htmlFor="wish-cost"
            hint="Leave blank if you don't know yet."
          >
            <Input
              id="wish-cost"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="e.g. 129.99"
              inputMode="decimal"
              className="font-mono"
            />
          </Field>
          <Field label="Quantity" htmlFor="wish-qty">
            <Input
              id="wish-qty"
              type="number"
              min={1}
              max={MAX_QUANTITY}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="font-mono"
              required
            />
          </Field>
        </div>
        {total !== null && (
          <p className="font-mono text-sm text-muted-foreground">
            Total{" "}
            <span className="font-bold text-foreground tabular-nums">
              {formatCost(total)}
            </span>
          </p>
        )}
      </FormSection>

      <FormSection title="Photo" description="Optional. Never cropped.">
        <div className="flex items-start gap-4">
          <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-border/80">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Photo preview"
                className="size-full object-contain"
              />
            ) : (
              <div className="grid size-full place-content-center gap-1.5 bg-well p-2 text-center text-muted-foreground">
                <ImageIcon className="mx-auto size-5" />
                <span className="font-mono text-xs">No photo</span>
              </div>
            )}
          </div>
          <Field
            label="Upload photo"
            htmlFor="wish-photo"
            hint="Resized to fit 800px. Max 10 MB."
            className="flex-1"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <label
                htmlFor="wish-photo"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "has-[+input:focus-visible]:ring-[3px]",
                })}
              >
                <Upload />
                {photoPreview ? "Replace image" : "Choose image"}
              </label>
              <input
                ref={photoInput}
                id="wish-photo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  // Ignore a cancelled picker rather than dropping the choice.
                  const file = e.target.files?.[0]
                  if (file) setPhotoFile(file)
                }}
                className="sr-only"
              />
              {photoPreview && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost-destructive"
                  onClick={onClearPhoto}
                >
                  {photoFile && savedPhoto ? "Keep saved photo" : "Remove"}
                </Button>
              )}
            </div>
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Where to buy"
        description="Zero or more links to stores selling it."
      >
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  aria-label={`Link ${index + 1}`}
                  value={link}
                  onChange={(e) => setLink(index, e.target.value)}
                  placeholder="https://…"
                  inputMode="url"
                  className="font-mono"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove link ${index + 1}`}
                  onClick={() =>
                    setLinks((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setLinks((prev) => [...prev, ""])}
        >
          <Plus />
          Add link
        </Button>
      </FormSection>

      {error && <FormError>{error}</FormError>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Add to wishlist"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <fieldset className="space-y-5 border-t border-border/70 pt-6 max-sm:first-of-type:border-t-0 max-sm:first-of-type:pt-0 sm:rounded-xl sm:border sm:border-border/80 sm:bg-card sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden>
        <p className="font-mono text-base font-extrabold md:text-lg">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </fieldset>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

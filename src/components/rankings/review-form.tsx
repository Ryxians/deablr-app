import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { ImageIcon } from "lucide-react"
import { ScoreNeighborPreview } from "./score-neighbor-preview"
import { TypeToggles } from "./type-toggles"
import type { ReactNode } from "react"
import type { MetricKey, PropertyType } from "@/lib/rankings"
import type { RankedReview } from "@/server/rankings"
import { TagCombobox } from "@/components/tag-combobox"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { METRICS, formatScore } from "@/lib/rankings"
import { cn } from "@/lib/utils"
import { createReview, listTags, updateReview } from "@/server/rankings"

/**
 * The Admin review form, used for both creating and editing a Review. Each
 * Metric gets its own Score input; as one is typed it previews the 3 Reviews
 * above and 3 below that slot on that Metric's axis.
 */
export function ReviewForm({ initial }: { initial?: RankedReview }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(initial?.title ?? "")
  const [types, setTypes] = useState<Array<PropertyType>>(
    (initial?.types ?? []) as Array<PropertyType>
  )
  const [tags, setTags] = useState<Array<string>>(initial?.tags ?? [])
  const [incomplete, setIncomplete] = useState(initial?.incomplete ?? false)
  const [scores, setScores] = useState<Record<MetricKey, string>>(
    () =>
      Object.fromEntries(
        METRICS.map((m) => {
          const value = initial?.scores[m.key]
          return [m.key, value !== undefined ? formatScore(value) : ""]
        })
      ) as Record<MetricKey, string>
  )
  const [text, setText] = useState(initial?.text ?? "")
  const [artFile, setArtFile] = useState<File | null>(null)
  const [artPreview, setArtPreview] = useState<string | null>(
    initial?.artUrl ?? null
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const existingTags = useQuery({
    queryKey: ["allTags"],
    queryFn: () => listTags(),
  })

  useEffect(() => {
    if (!artFile) return
    const url = URL.createObjectURL(artFile)
    setArtPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [artFile])

  function toggleType(type: PropertyType, checked: boolean) {
    setTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type)
    )
  }

  function setScore(metric: MetricKey, value: string) {
    setScores((prev) => ({ ...prev, [metric]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (types.length === 0) {
      setError("Select at least one Property Type")
      return
    }
    if (METRICS.every((m) => scores[m.key].trim() === "")) {
      setError("At least one Metric must have a Score")
      return
    }
    const fd = new FormData()
    fd.set("title", title)
    fd.set("types", JSON.stringify(types))
    fd.set("tags", tags.join(","))
    fd.set("incomplete", String(incomplete))
    fd.set("scores", JSON.stringify(scores))
    fd.set("text", text)
    if (artFile) fd.set("art", artFile)

    setPending(true)
    try {
      if (initial) {
        fd.set("reviewId", initial.reviewId)
        await updateReview({ data: fd })
        await navigate({
          to: "/rankings/$reviewId",
          params: { reviewId: initial.reviewId },
        })
      } else {
        const { reviewId } = await createReview({ data: fd })
        await navigate({ to: "/rankings/$reviewId", params: { reviewId } })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <FormSection title="The basics">
        <Field label="Property title" htmlFor="review-title">
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scooby-Doo, Where Are You!"
            required
          />
        </Field>

        <Field label="Type" hint="Pick every format the review covers.">
          <TypeToggles
            idPrefix="review-type"
            selected={types}
            onToggle={toggleType}
          />
        </Field>

        <Field
          label="Tags"
          htmlFor="review-tags"
          hint="Pick existing tags or type a new one. Saved lowercase."
        >
          <TagCombobox
            id="review-tags"
            options={existingTags.data ?? []}
            selected={tags}
            onChange={setTags}
            creatable
            placeholder="Pick or define tags…"
          />
        </Field>

        <label
          htmlFor="review-incomplete"
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-well/50 p-3.5"
        >
          <Checkbox
            id="review-incomplete"
            checked={incomplete}
            onCheckedChange={(checked) => setIncomplete(!!checked)}
            className="mt-0.5"
          />
          <span>
            <span className="block font-mono text-[13px] font-semibold">
              Incomplete
            </span>
            <span className="block text-sm text-muted-foreground">
              Still watching, reading, or playing.
            </span>
          </span>
        </label>
      </FormSection>

      <FormSection title="Poster">
        <div className="flex items-start gap-4">
          <div className="aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-lg bg-well ring-1 ring-border/80">
            {artPreview ? (
              <img
                src={artPreview}
                alt="Poster preview"
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-content-center gap-1.5 p-2 text-center text-muted-foreground">
                <ImageIcon className="mx-auto size-5" />
                <span className="font-mono text-[11px]">2:3 poster</span>
              </div>
            )}
          </div>
          <Field
            label="Upload art"
            htmlFor="review-art"
            hint="Cropped to a 2:3 poster on upload. Max 10 MB."
            className="flex-1"
          >
            <Input
              id="review-art"
              type="file"
              accept="image/*"
              onChange={(e) => setArtFile(e.target.files?.[0] ?? null)}
              required={!initial}
              className="h-auto py-1.5"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Scores"
        description="At least one. Ten at the top, no floor, up to 3 decimals."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {METRICS.map((metric) => (
            <Field
              key={metric.key}
              label={metric.label}
              htmlFor={`review-score-${metric.key}`}
            >
              <Input
                id={`review-score-${metric.key}`}
                value={scores[metric.key]}
                onChange={(e) => setScore(metric.key, e.target.value)}
                placeholder="e.g. 8.5"
                inputMode="decimal"
                className="font-mono"
              />
              <ScoreNeighborPreview
                metric={metric.key}
                scoreInput={scores[metric.key]}
                excludeReviewId={initial?.reviewId}
              />
            </Field>
          ))}
        </div>
      </FormSection>

      <FormSection title="Review">
        <Field
          label="Your take"
          htmlFor="review-text"
          hint="Markdown works. Wrap secrets in <spoiler>…</spoiler>."
        >
          <Textarea
            id="review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-48"
            required
          />
        </Field>
      </FormSection>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Publish review"}
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
    <fieldset className="space-y-5 rounded-xl border border-border/80 bg-card p-5 md:p-6">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden>
        <p className="font-mono text-sm font-bold">{title}</p>
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

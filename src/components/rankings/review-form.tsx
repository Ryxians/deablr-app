import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { ScoreNeighborPreview } from "./score-neighbor-preview"
import type { MetricKey, PropertyType } from "@/lib/rankings"
import type { RankedReview } from "@/server/rankings"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  METRICS,
  PROPERTY_TYPES,
  formatScore,
  typeLabel,
} from "@/lib/rankings"
import { createReview, updateReview } from "@/server/rankings"

/**
 * The Admin review form, used for both creating and editing a Review. Each
 * Metric gets its own Score input; as one is typed it previews the 3 Reviews
 * above and 3 below that slot on that Metric's axis.
 */
export function ReviewForm({ initial }: { initial?: RankedReview }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(initial?.title ?? "")
  const [types, setTypes] = useState<Array<PropertyType>>(
    (initial?.types ?? []) as Array<PropertyType>,
  )
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "")
  const [scores, setScores] = useState<Record<MetricKey, string>>(() =>
    Object.fromEntries(
      METRICS.map((m) => {
        const value = initial?.scores[m.key]
        return [m.key, value !== undefined ? formatScore(value) : ""]
      }),
    ) as Record<MetricKey, string>,
  )
  const [text, setText] = useState(initial?.text ?? "")
  const [artFile, setArtFile] = useState<File | null>(null)
  const [artPreview, setArtPreview] = useState<string | null>(
    initial?.artUrl ?? null,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!artFile) return
    const url = URL.createObjectURL(artFile)
    setArtPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [artFile])

  function toggleType(type: PropertyType, checked: boolean) {
    setTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type),
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
    fd.set("tags", tags)
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
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <Label htmlFor="review-title">Property Title</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label>Property Type</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {PROPERTY_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <Checkbox
                id={`review-type-${type}`}
                checked={types.includes(type)}
                onCheckedChange={(checked) => toggleType(type, !!checked)}
              />
              <Label
                htmlFor={`review-type-${type}`}
                className="text-sm font-normal"
              >
                {typeLabel(type)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="review-tags">Property Tags</Label>
        <Input
          id="review-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="fantasy, animated, romance"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated; normalized to lowercase.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="review-art">Property Art</Label>
        <div className="flex items-start gap-3">
          <div className="aspect-[2/3] w-28 overflow-hidden rounded-md border border-border bg-muted">
            {artPreview ? (
              <img
                src={artPreview}
                alt="Art preview"
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-content-center p-2 text-center text-xs text-muted-foreground">
                2:3 poster preview
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Input
              id="review-art"
              type="file"
              accept="image/*"
              onChange={(e) => setArtFile(e.target.files?.[0] ?? null)}
              required={!initial}
            />
            <p className="text-xs text-muted-foreground">
              Cropped to a 2:3 poster on upload. Max 10 MB.
            </p>
          </div>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Scores <span className="text-muted-foreground">(at least one)</span>
        </legend>
        {METRICS.map((metric) => (
          <div key={metric.key} className="space-y-1">
            <Label htmlFor={`review-score-${metric.key}`}>
              {metric.label}
            </Label>
            <Input
              id={`review-score-${metric.key}`}
              value={scores[metric.key]}
              onChange={(e) => setScore(metric.key, e.target.value)}
              placeholder="-n to 10, up to 3 decimals"
              inputMode="decimal"
            />
            <ScoreNeighborPreview
              metric={metric.key}
              scoreInput={scores[metric.key]}
              excludeReviewId={initial?.reviewId}
            />
          </div>
        ))}
      </fieldset>

      <div className="space-y-1">
        <Label htmlFor="review-text">Review</Label>
        <Textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-40"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : initial ? "Save changes" : "Publish Review"}
      </Button>
    </form>
  )
}

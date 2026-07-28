import { useMemo, useState } from "react"
import { ScoreBandCarousel } from "./score-band-carousel"
import type { MetricKey, PropertyType } from "@/lib/rankings"
import type { RankedReview } from "@/server/rankings"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BANDS_BEST_FIRST,
  METRICS,
  PROPERTY_TYPES,
  averageScore,
  bandForScore,
  typeLabel,
} from "@/lib/rankings"

type Direction = "desc" | "asc"
/** The axis the board orders and bands by: the Average or one Metric. */
type Axis = "average" | MetricKey

function axisScore(item: RankedReview, axis: Axis): number | null {
  if (axis === "average") return averageScore(item.scores)
  return item.scores[axis] ?? null
}

/**
 * The Rankings board: ordering axis + direction + filters over the full list,
 * always grouped into Score Band carousels. Reviews with no Score on the
 * active Metric are hidden; bands survive filtering.
 */
export function RankingsBoard({ reviews }: { reviews: Array<RankedReview> }) {
  const [axis, setAxis] = useState<Axis>("average")
  const [direction, setDirection] = useState<Direction>("desc")
  const [selectedTypes, setSelectedTypes] = useState<Array<PropertyType>>([])
  const [selectedTags, setSelectedTags] = useState<Array<string>>([])

  const allTags = useMemo(
    () => [...new Set(reviews.flatMap((r) => r.tags))].sort(),
    [reviews],
  )

  const bands = useMemo(() => {
    const filtered = reviews.filter(
      (r) =>
        (selectedTypes.length === 0 ||
          r.types.some((t) => selectedTypes.includes(t as PropertyType))) &&
        selectedTags.every((tag) => r.tags.includes(tag)),
    )
    const byBand = new Map<string, Array<RankedReview>>()
    for (const item of filtered) {
      const score = axisScore(item, axis)
      // Reviews unrated on the active Metric are hidden.
      if (score === null) continue
      const key = String(bandForScore(score))
      byBand.set(key, [...(byBand.get(key) ?? []), item])
    }
    const order =
      direction === "desc" ? BANDS_BEST_FIRST : [...BANDS_BEST_FIRST].reverse()
    return order.map((key) => {
      const items = byBand.get(String(key)) ?? []
      items.sort((a, b) => {
        const diff = axisScore(a, axis)! - axisScore(b, axis)!
        return direction === "desc" ? -diff : diff
      })
      return { band: key, items }
    })
  }, [reviews, axis, direction, selectedTypes, selectedTags])

  const hasFilters = selectedTypes.length > 0 || selectedTags.length > 0

  function toggleType(type: PropertyType, checked: boolean) {
    setSelectedTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type),
    )
  }

  function toggleTag(tag: string, checked: boolean) {
    setSelectedTags((prev) =>
      checked ? [...prev, tag] : prev.filter((t) => t !== tag),
    )
  }

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="rankings-axis">Rank by</Label>
            <Select value={axis} onValueChange={(v) => setAxis(v as Axis)}>
              <SelectTrigger id="rankings-axis" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="average">Average</SelectItem>
                {METRICS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rankings-direction">Order</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as Direction)}
            >
              <SelectTrigger id="rankings-direction" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Best to worst</SelectItem>
                <SelectItem value="asc">Worst to best</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTypes([])
                setSelectedTags([])
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm text-muted-foreground">Type</span>
          {PROPERTY_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <Checkbox
                id={`filter-type-${type}`}
                checked={selectedTypes.includes(type)}
                onCheckedChange={(checked) => toggleType(type, !!checked)}
              />
              <Label
                htmlFor={`filter-type-${type}`}
                className="text-sm font-normal"
              >
                {typeLabel(type)}
              </Label>
            </div>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-sm text-muted-foreground">Tags</span>
            {allTags.map((tag) => (
              <div key={tag} className="flex items-center gap-1.5">
                <Checkbox
                  id={`filter-tag-${tag}`}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={(checked) => toggleTag(tag, !!checked)}
                />
                <Label
                  htmlFor={`filter-tag-${tag}`}
                  className="text-sm font-normal"
                >
                  {tag}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p>No Reviews yet.</p>
      ) : (
        bands.map(({ band, items }) => (
          <ScoreBandCarousel key={band} band={band} items={items} />
        ))
      )}
    </div>
  )
}

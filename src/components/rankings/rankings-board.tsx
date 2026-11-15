import { useMemo, useState } from "react"
import { FileDown, X } from "lucide-react"
import { ScoreBandCarousel } from "./score-band-carousel"
import { TypeToggles } from "./type-toggles"
import type { ReactNode } from "react"
import type { MetricKey, PropertyType } from "@/lib/rankings"
import type { RankedReview } from "@/server/rankings"
import { TagCombobox } from "@/components/tag-combobox"
import { Button } from "@/components/ui/button"
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
  averageScore,
  bandForScore,
} from "@/lib/rankings"
import { exportRankingsPdf } from "@/lib/export-pdf"
import { cn } from "@/lib/utils"

type Direction = "desc" | "asc"
/** The axis the board orders and bands by: the Average or one Metric. */
type Axis = "average" | MetricKey
/** Completion filter: all Reviews, or only complete/incomplete Properties. */
type Completion = "all" | "complete" | "incomplete"

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
  const [completion, setCompletion] = useState<Completion>("all")
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const allTags = useMemo(
    () => [...new Set(reviews.flatMap((r) => r.tags))].sort(),
    [reviews]
  )

  const bands = useMemo(() => {
    const filtered = reviews.filter(
      (r) =>
        (selectedTypes.length === 0 ||
          r.types.some((t) => selectedTypes.includes(t as PropertyType))) &&
        selectedTags.every((tag) => r.tags.includes(tag)) &&
        (completion === "all" || (completion === "incomplete") === r.incomplete)
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
  }, [reviews, axis, direction, selectedTypes, selectedTags, completion])

  const hasFilters =
    selectedTypes.length > 0 || selectedTags.length > 0 || completion !== "all"

  function toggleType(type: PropertyType, checked: boolean) {
    setSelectedTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type)
    )
  }

  /** Exports exactly what the board currently shows, in display order. */
  async function onExportPdf() {
    setExporting(true)
    setExportError(null)
    try {
      await exportRankingsPdf(bands.flatMap((b) => b.items))
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Could not export PDF"
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="mb-10 space-y-4 rounded-xl border border-border/80 bg-card p-4 md:p-5">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
          <FilterField label="Rank by" htmlFor="rankings-axis">
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
          </FilterField>
          <FilterField label="Order" htmlFor="rankings-direction">
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
          </FilterField>
          <FilterField label="Status" htmlFor="rankings-completion">
            <Select
              value={completion}
              onValueChange={(v) => setCompletion(v as Completion)}
            >
              <SelectTrigger id="rankings-completion" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          {allTags.length > 0 && (
            <FilterField
              label="Tags"
              htmlFor="filter-tags"
              className="min-w-48 flex-1 basis-56"
            >
              <TagCombobox
                id="filter-tags"
                options={allTags}
                selected={selectedTags}
                onChange={setSelectedTags}
                placeholder="Filter by tags…"
              />
            </FilterField>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="mr-1 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Type
          </span>
          <TypeToggles
            idPrefix="filter-type"
            selected={selectedTypes}
            onToggle={toggleType}
          />
          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTypes([])
                  setSelectedTags([])
                  setCompletion("all")
                }}
              >
                <X />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={exporting || reviews.length === 0}
              onClick={() => void onExportPdf()}
            >
              <FileDown />
              {exporting ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </div>
        {exportError && (
          <p className="text-sm text-destructive">{exportError}</p>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState>No Reviews yet.</EmptyState>
      ) : bands.every((b) => b.items.length === 0) ? (
        <EmptyState>Nothing matches those filters.</EmptyState>
      ) : (
        bands.map(({ band, items }) => (
          <ScoreBandCarousel key={band} band={band} items={items} />
        ))
      )}
    </div>
  )
}

function FilterField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-[11px] tracking-wider text-muted-foreground uppercase"
      >
        {label}
      </Label>
      {children}
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border py-16 text-center font-mono text-sm text-muted-foreground">
      {children}
    </p>
  )
}

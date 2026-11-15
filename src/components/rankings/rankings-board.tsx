import { useMemo, useState } from "react"
import { ChevronDown, FileDown, SlidersHorizontal, X } from "lucide-react"
import { ScoreBandCarousel } from "./score-band-carousel"
import { TypeToggles } from "./type-toggles"
import type { ReactNode } from "react"
import type { MetricKey, PropertyType } from "@/lib/rankings"
import type { RankedReview } from "@/server/rankings"
import { PageHeader } from "@/components/page-header"
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
export function RankingsBoard({
  reviews,
  headerAction,
}: {
  reviews: Array<RankedReview>
  /** Extra page-header action, e.g. the Admin's New Review button. */
  headerAction?: ReactNode
}) {
  const [axis, setAxis] = useState<Axis>("average")
  const [direction, setDirection] = useState<Direction>("desc")
  const [selectedTypes, setSelectedTypes] = useState<Array<PropertyType>>([])
  const [selectedTags, setSelectedTags] = useState<Array<string>>([])
  const [completion, setCompletion] = useState<Completion>("all")
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  const filterCount =
    selectedTypes.length + selectedTags.length + (completion !== "all" ? 1 : 0)

  return (
    <div>
      <PageHeader
        path="rankings"
        title="Rankings"
        description="Everything I've watched, played, and read, scored on Fun and Art. Ten is the best; there is no floor."
        actions={
          <>
            {headerAction}
            <Button
              variant="outline"
              className="hidden md:inline-flex"
              disabled={exporting || reviews.length === 0}
              onClick={() => void onExportPdf()}
            >
              <FileDown />
              {exporting ? "Exporting…" : "Export PDF"}
            </Button>
          </>
        }
      />
      {exportError && (
        <p className="-mt-4 mb-6 text-sm text-destructive">{exportError}</p>
      )}

      <div className="mb-8 rounded-xl border border-border/50 bg-card md:mb-10">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="rankings-filters"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 font-mono text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
        >
          <SlidersHorizontal className="size-4 text-secondary" />
          Sort &amp; filter
          {filterCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-xs text-secondary-foreground">
              {filterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-muted-foreground transition-transform",
              filtersOpen && "rotate-180"
            )}
          />
        </button>

        <div
          id="rankings-filters"
          className={cn(
            "space-y-4 border-t border-border/60 p-4 md:block md:border-t-0 md:p-5",
            !filtersOpen && "hidden"
          )}
        >
          <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-end">
            <FilterField label="Rank by" htmlFor="rankings-axis">
              <Select value={axis} onValueChange={(v) => setAxis(v as Axis)}>
                <SelectTrigger id="rankings-axis" className="w-full md:w-36">
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
                <SelectTrigger
                  id="rankings-direction"
                  className="w-full md:w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Best first</SelectItem>
                  <SelectItem value="asc">Worst first</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Status" htmlFor="rankings-completion">
              <Select
                value={completion}
                onValueChange={(v) => setCompletion(v as Completion)}
              >
                <SelectTrigger
                  id="rankings-completion"
                  className="w-full md:w-36"
                >
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
                className="col-span-2 md:min-w-56 md:flex-1"
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
            <span className="mr-1 w-full font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase md:w-auto">
              Type
            </span>
            <TypeToggles
              idPrefix="filter-type"
              selected={selectedTypes}
              onToggle={toggleType}
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setSelectedTypes([])
                  setSelectedTags([])
                  setCompletion("all")
                }}
              >
                <X />
                Clear filters
              </Button>
            )}
          </div>
          {/* Phones: export lives with the filters it applies to. */}
          <Button
            variant="outline"
            className="w-full md:hidden"
            disabled={exporting || reviews.length === 0}
            onClick={() => void onExportPdf()}
          >
            <FileDown />
            {exporting ? "Exporting…" : "Export what's shown as PDF"}
          </Button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState>No Reviews yet.</EmptyState>
      ) : bands.every((b) => b.items.length === 0) ? (
        <EmptyState>Nothing matches those filters.</EmptyState>
      ) : (
        <div>
          {bands.map(({ band, items }) => (
            <ScoreBandCarousel key={band} band={band} items={items} />
          ))}
        </div>
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
        className="text-xs tracking-wide text-muted-foreground uppercase"
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

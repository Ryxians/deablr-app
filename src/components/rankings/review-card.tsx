import { Link } from "@tanstack/react-router"
import type { RankedReview } from "@/server/rankings"
import {
  METRICS,
  averageScore,
  formatAverage,
  formatScore,
  isPeak,
} from "@/lib/rankings"

export function PeakChip() {
  return (
    <span className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-yellow-950 uppercase shadow">
      Peak
    </span>
  )
}

export function IncompleteChip() {
  return (
    <span className="absolute top-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase shadow">
      Incomplete
    </span>
  )
}

/** Poster + title + average + per-metric scores, linking to the detail page. */
export function ReviewCard({ item }: { item: RankedReview }) {
  const defined = METRICS.filter((m) => item.scores[m.key] !== undefined)
  return (
    <Link
      to="/rankings/$reviewId"
      params={{ reviewId: item.reviewId }}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-muted">
        <img
          src={item.artUrl}
          alt={item.title}
          className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        {isPeak(item.scores) && <PeakChip />}
        {item.incomplete && <IncompleteChip />}
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-tight font-medium">
        {item.title}
      </p>
      <p className="text-xs font-bold tabular-nums">
        {formatAverage(averageScore(item.scores))}
      </p>
      <p className="text-[10px] text-muted-foreground tabular-nums">
        {defined
          .map((m) => `${m.label} ${formatScore(item.scores[m.key]!)}`)
          .join(" · ")}
      </p>
    </Link>
  )
}

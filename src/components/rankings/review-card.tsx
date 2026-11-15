import { Link } from "@tanstack/react-router"
import { Star } from "lucide-react"
import type { RankedReview } from "@/server/rankings"
import { Chip } from "@/components/ui/chip"
import {
  METRICS,
  averageScore,
  formatAverage,
  formatScore,
  isPeak,
} from "@/lib/rankings"

export function PeakChip() {
  return (
    <Chip tone="sun" size="xs" className="absolute top-2 right-2">
      <Star className="size-2.5 fill-current" strokeWidth={0} />
      Peak
    </Chip>
  )
}

export function IncompleteChip() {
  return (
    <Chip tone="solid" size="xs" className="absolute top-2 left-2">
      Incomplete
    </Chip>
  )
}

/** Poster + title + average + per-metric scores, linking to the detail page. */
export function ReviewCard({ item }: { item: RankedReview }) {
  const defined = METRICS.filter((m) => item.scores[m.key] !== undefined)
  return (
    <Link
      to="/rankings/$reviewId"
      params={{ reviewId: item.reviewId }}
      className="group block rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-well ring-1 ring-border/80 transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-primary">
        <img
          src={item.artUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
        {isPeak(item.scores) && <PeakChip />}
        {item.incomplete && <IncompleteChip />}
      </div>
      <p className="mt-2.5 line-clamp-2 text-sm leading-snug font-bold text-foreground group-hover:text-primary">
        {item.title}
      </p>
      <p className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
        <span className="text-sm font-bold text-primary">
          {formatAverage(averageScore(item.scores))}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {defined
            .map((m) => `${m.label} ${formatScore(item.scores[m.key]!)}`)
            .join(" · ")}
        </span>
      </p>
    </Link>
  )
}

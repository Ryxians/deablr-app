import { Link } from "@tanstack/react-router"
import { ReviewCard } from "./review-card"
import type { RankedReview } from "@/server/rankings"
import type { BandKey } from "@/lib/rankings"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel"
import {
  METRICS,
  averageScore,
  bandTone,
  formatAverage,
  formatScore,
} from "@/lib/rankings"
import { cn } from "@/lib/utils"

/**
 * Edge fades shown while more cards are scrollable in that direction — a
 * touch-device affordance that the row continues off-screen.
 */
function CarouselEdgeFades() {
  const { canScrollPrev, canScrollNext } = useCarousel()
  return (
    <>
      {canScrollPrev && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent"
        />
      )}
      {canScrollNext && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent"
        />
      )}
    </>
  )
}

function CarouselArrows() {
  const { canScrollPrev, canScrollNext } = useCarousel()
  if (!canScrollPrev && !canScrollNext) return null
  return (
    <div className="hidden gap-1.5 sm:flex">
      <CarouselPrevious className="static translate-y-0" />
      <CarouselNext className="static translate-y-0" />
    </div>
  )
}

function bandRange(band: BandKey): string {
  if (band === "poop") return "below 0"
  if (band === 10) return "perfect"
  return `${band}.0–${band}.99`
}

function BandBadge({ band }: { band: BandKey }) {
  return (
    <span
      className={cn(
        "grid h-11 min-w-11 place-items-center rounded-lg px-2 font-mono text-xl font-extrabold tabular-nums shadow-lift md:h-16 md:min-w-16 md:text-4xl",
        bandTone(band)
      )}
    >
      {band === "poop" ? "<0" : band}
    </span>
  )
}

function BandCaption({ band, count }: { band: BandKey; count: number }) {
  return (
    <span className="font-mono text-sm leading-tight">
      <span className="block font-semibold text-foreground">
        {band === "poop" ? "Certified Poop" : bandRange(band)}
      </span>
      <span className="block text-xs text-muted-foreground">
        {count} {count === 1 ? "title" : "titles"}
      </span>
    </span>
  )
}

/** A lone review on phones: thumb, title, scores, all on one line. */
function CompactRow({ item }: { item: RankedReview }) {
  const defined = METRICS.filter((m) => item.scores[m.key] !== undefined)
  return (
    <Link
      to="/rankings/$reviewId"
      params={{ reviewId: item.reviewId }}
      className="flex items-center gap-3.5 rounded-xl border border-border/50 bg-card p-2.5 pr-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <img
        src={item.artUrl}
        alt=""
        className="aspect-[2/3] w-16 shrink-0 rounded-md object-cover ring-1 ring-border/80"
        loading="lazy"
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 leading-snug font-bold">
          {item.title}
        </span>
        <span className="mt-1 block font-mono text-[13px] text-muted-foreground tabular-nums">
          {defined
            .map((m) => `${m.label} ${formatScore(item.scores[m.key]!)}`)
            .join(" · ")}
        </span>
      </span>
      <span className="font-mono text-lg font-extrabold tabular-nums">
        {formatAverage(averageScore(item.scores))}
      </span>
    </Link>
  )
}

/**
 * One Score Band. Phones get a swipeable row (two cards plus a peek);
 * wider screens get a tier-list row: band label on the left, posters
 * wrapping on the right.
 */
export function ScoreBandCarousel({
  band,
  items,
}: {
  band: BandKey
  items: Array<RankedReview>
}) {
  if (items.length === 0) return null
  // Small tiers sit two-up on wider screens and as a compact row on phones,
  // so a lone title doesn't cost a whole screen.
  const small = items.length <= 2
  return (
    <section
      aria-label={band === "poop" ? "Certified Poop" : `Score band ${band}`}
      className={cn(
        "border-t border-border/60 py-5 first:border-t-0 first:pt-0 md:grid md:gap-6 md:py-6",
        small
          ? "md:grid-cols-[5.5rem_minmax(0,1fr)]"
          : "md:col-span-2 md:grid-cols-[8rem_minmax(0,1fr)]"
      )}
    >
      {/* Phones: a lone title gets a compact row. */}
      {items.length === 1 && (
        <div className="md:hidden">
          <h2 className="mb-3 flex items-center gap-3">
            <BandBadge band={band} />
            <BandCaption band={band} count={1} />
          </h2>
          <CompactRow item={items[0]} />
        </div>
      )}

      {/* Phones: a swipeable row. */}
      <div className={cn("md:hidden", items.length === 1 && "hidden")}>
        <Carousel opts={{ align: "start" }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-3">
              <BandBadge band={band} />
              <BandCaption band={band} count={items.length} />
            </h2>
            <CarouselArrows />
          </div>
          <div className="relative">
            <CarouselEdgeFades />
            <CarouselContent>
              {items.map((item) => (
                <CarouselItem key={item.reviewId} className="basis-[40%]">
                  <ReviewCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
        </Carousel>
      </div>

      {/* Tablets and up */}
      <h2 className="hidden md:sticky md:top-6 md:flex md:flex-col md:items-start md:gap-3 md:self-start">
        <BandBadge band={band} />
        <BandCaption band={band} count={items.length} />
      </h2>
      <ul
        className={cn(
          "hidden md:grid md:gap-x-6 md:gap-y-8",
          small
            ? "md:grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))]"
            : "md:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]"
        )}
      >
        {items.map((item) => (
          <li key={item.reviewId}>
            <ReviewCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

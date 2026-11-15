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
import { bandTone } from "@/lib/rankings"
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
    <div className="flex gap-1.5">
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
  return (
    <section
      aria-label={band === "poop" ? "Certified Poop" : `Score band ${band}`}
      className="border-t border-border/60 py-6 first:border-t-0 first:pt-0 md:grid md:grid-cols-[8rem_minmax(0,1fr)] md:gap-6 md:py-7"
    >
      {/* Phones */}
      <div className="md:hidden">
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
                <CarouselItem key={item.reviewId} className="basis-[44%]">
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
      <ul className="hidden md:grid md:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] md:gap-x-6 md:gap-y-8">
        {items.map((item) => (
          <li key={item.reviewId}>
            <ReviewCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

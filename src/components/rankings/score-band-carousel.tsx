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
      <CarouselPrevious className="static size-8 translate-y-0" />
      <CarouselNext className="static size-8 translate-y-0" />
    </div>
  )
}

/** One Score Band: a labeled carousel of the Reviews in it. */
export function ScoreBandCarousel({
  band,
  items,
}: {
  band: BandKey
  items: Array<RankedReview>
}) {
  if (items.length === 0) return null
  const poop = band === "poop"
  return (
    <section className="mb-10 last:mb-0">
      <Carousel opts={{ align: "start" }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-3">
            <span
              className={cn(
                "grid h-9 min-w-9 place-items-center rounded-md px-2 font-mono text-lg font-extrabold tabular-nums",
                poop
                  ? "bg-[oklch(0.5_0.08_60)] text-[oklch(0.95_0.03_80)]"
                  : band === 10
                    ? "bg-sun text-[oklch(0.25_0.06_80)]"
                    : "bg-primary/15 text-primary ring-1 ring-primary/40 ring-inset"
              )}
            >
              {poop ? "<0" : band}
            </span>
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              {poop
                ? "Certified Poop"
                : band === 10
                  ? "Perfect 10"
                  : `${band}.0 – ${band}.99`}
              <span className="ml-2 text-xs font-normal opacity-75">
                {items.length} {items.length === 1 ? "title" : "titles"}
              </span>
            </span>
          </h2>
          <CarouselArrows />
        </div>
        <div className="relative">
          <CarouselEdgeFades />
          <CarouselContent>
            {items.map((item) => (
              <CarouselItem
                key={item.reviewId}
                // Mobile shows 2 cards plus a peek of the next so it reads as
                // scrollable; wider viewports fit whole cards.
                className="basis-[42%] sm:basis-1/4 lg:basis-1/5"
              >
                <ReviewCard item={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>
    </section>
  )
}

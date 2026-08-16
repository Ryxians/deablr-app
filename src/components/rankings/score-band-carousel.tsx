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
import { bandLabel } from "@/lib/rankings"

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
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent"
        />
      )}
      {canScrollNext && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent"
        />
      )}
    </>
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
  return (
    <section className="mb-8">
      <Carousel opts={{ align: "start" }}>
        <div className="mb-2 flex items-center justify-between border-b border-border pb-1">
          <h2 className="text-xl font-bold">{bandLabel(band)}</h2>
          <div className="flex gap-1">
            <CarouselPrevious className="static size-7 translate-y-0" />
            <CarouselNext className="static size-7 translate-y-0" />
          </div>
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

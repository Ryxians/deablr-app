import { ReviewCard } from "./review-card"
import type { RankedReview } from "@/server/rankings"
import type {BandKey} from "@/lib/rankings";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {  bandLabel } from "@/lib/rankings"

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
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem
              key={item.reviewId}
              className="basis-1/3 sm:basis-1/4 lg:basis-1/5"
            >
              <ReviewCard item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}

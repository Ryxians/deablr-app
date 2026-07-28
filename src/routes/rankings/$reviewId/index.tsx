import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from "@tanstack/react-router"
import { useState } from "react"
import type { PropertyType } from "@/lib/rankings"
import { PeakChip } from "@/components/rankings/review-card"
import { Button } from "@/components/ui/button"
import {
  METRICS,
  averageScore,
  formatAverage,
  formatScore,
  isPeak,
  typeLabel,
} from "@/lib/rankings"
import { deleteReview, getReview } from "@/server/rankings"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/rankings/$reviewId/")({
  loader: async ({ params }) => {
    const [review, user] = await Promise.all([
      getReview({ data: { reviewId: params.reviewId } }),
      getCurrentUser(),
    ])
    if (!review) throw notFound()
    return { review, user }
  },
  component: ReviewDetailPage,
})

function ReviewDetailPage() {
  const { review, user } = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function onDelete() {
    if (!window.confirm(`Delete the review of "${review.title}"?`)) return
    setError(null)
    try {
      await deleteReview({ data: { reviewId: review.reviewId } })
      await navigate({ to: "/rankings" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete review")
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative w-40 shrink-0 overflow-hidden rounded-md border border-border sm:w-52">
          <img
            src={review.artUrl}
            alt={review.title}
            className="aspect-[2/3] size-full object-cover"
          />
          {isPeak(review.scores) && <PeakChip />}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{review.title}</h1>
          <p className="mt-1 text-xl font-bold tabular-nums text-primary">
            {formatAverage(averageScore(review.scores))}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              avg
            </span>
          </p>
          <div className="mt-1 flex gap-3 text-sm tabular-nums">
            {METRICS.map((m) => {
              const score = review.scores[m.key]
              return (
                <span key={m.key}>
                  <span className="text-muted-foreground">{m.label}</span>{" "}
                  {score !== undefined ? (
                    <span className="font-bold">{formatScore(score)}</span>
                  ) : (
                    "—"
                  )}
                </span>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(review.types as Array<PropertyType>).map((type) => (
              <span
                key={type}
                className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
              >
                {typeLabel(type)}
              </span>
            ))}
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          {user?.role === "admin" && (
            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/rankings/$reviewId/edit"
                params={{ reviewId: review.reviewId }}
              >
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void onDelete()}
              >
                Delete
              </Button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
      <p className="mt-6 max-w-prose whitespace-pre-wrap">{review.text}</p>
    </div>
  )
}

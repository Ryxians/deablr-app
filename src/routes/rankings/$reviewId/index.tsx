import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import type { PropertyType } from "@/lib/rankings"
import { PathCrumb } from "@/components/page-header"
import { IncompleteChip, PeakChip } from "@/components/rankings/review-card"
import { ReviewText } from "@/components/rankings/review-text"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import {
  METRICS,
  averageScore,
  bandForScore,
  bandTone,
  formatAverage,
  formatScore,
  isPeak,
  typeLabel,
} from "@/lib/rankings"
import { cn } from "@/lib/utils"
import { deleteReview, getReview, listRankings } from "@/server/rankings"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/rankings/$reviewId/")({
  loader: async ({ params }) => {
    const [review, user, all] = await Promise.all([
      getReview({ data: { reviewId: params.reviewId } }),
      getCurrentUser(),
      listRankings(),
    ])
    if (!review) throw notFound()
    const ordered = [...all].sort(
      (a, b) => averageScore(b.scores) - averageScore(a.scores)
    )
    const rank = ordered.findIndex((r) => r.reviewId === review.reviewId) + 1
    return { review, user, rank, total: all.length }
  },
  component: ReviewDetailPage,
})

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function ReviewDetailPage() {
  const { review, user, rank, total } = Route.useLoaderData()
  const average = averageScore(review.scores)
  const band = bandForScore(average)
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
      <div className="mb-6">
        <PathCrumb path={`rankings/${slugify(review.title)}`} />
      </div>

      <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-6 sm:grid-cols-[14rem_minmax(0,1fr)] sm:grid-rows-[auto_1fr] sm:gap-x-8">
        <div className="relative self-start overflow-hidden rounded-xl ring-1 ring-border/80 sm:row-span-2">
          <img
            src={review.artUrl}
            alt={review.title}
            className="aspect-[2/3] size-full object-cover"
          />
          {isPeak(review.scores) && <PeakChip />}
          {review.incomplete && <IncompleteChip />}
        </div>

        <div className="min-w-0 self-center sm:self-start">
          <div className="flex flex-wrap gap-1.5">
            {(review.types as Array<PropertyType>).map((type) => (
              <Chip key={type} tone="primary">
                {typeLabel(type)}
              </Chip>
            ))}
            {review.tags.map((tag) => (
              <Chip key={tag} tone="muted">
                #{tag}
              </Chip>
            ))}
          </div>
          <h1 className="mt-3 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            {review.title}
          </h1>
          {rank > 0 && (
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              Ranked <span className="font-bold text-foreground">#{rank}</span>{" "}
              of {total} by average
            </p>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1 sm:col-start-2">
          <dl className="flex items-stretch overflow-hidden rounded-xl border border-border/50 bg-card sm:max-w-lg">
            <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
              <Link
                to="/rankings"
                title={band === "poop" ? "Certified Poop" : `Tier ${band}`}
                className={cn(
                  "grid h-12 min-w-12 place-items-center rounded-lg px-2 font-mono text-2xl font-extrabold shadow-lift outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  bandTone(band)
                )}
              >
                {band === "poop" ? "<0" : band}
              </Link>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 font-mono text-xs text-muted-foreground">
                  average
                </dt>
                <dd className="font-mono text-3xl leading-none font-extrabold tabular-nums sm:text-4xl">
                  {formatAverage(average)}
                </dd>
              </div>
            </div>
            {METRICS.map((m) => {
              const score = review.scores[m.key]
              return (
                <div
                  key={m.key}
                  className="flex flex-1 flex-col-reverse justify-center border-l border-border/50 px-4 py-4 sm:px-5"
                >
                  <dt className="mt-1.5 font-mono text-xs text-muted-foreground">
                    {m.label.toLowerCase()}
                  </dt>
                  <dd className="font-mono text-xl leading-none font-bold tabular-nums">
                    {score !== undefined ? formatScore(score) : "—"}
                  </dd>
                </div>
              )
            })}
          </dl>

          {user?.role === "admin" && (
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link
                  to="/rankings/$reviewId/edit"
                  params={{ reviewId: review.reviewId }}
                >
                  <Pencil />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost-destructive"
                onClick={() => void onDelete()}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>

      <ReviewText text={review.text} />
    </div>
  )
}

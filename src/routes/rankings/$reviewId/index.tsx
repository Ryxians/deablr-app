import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from "@tanstack/react-router"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import type { PropertyType } from "@/lib/rankings"
import { IncompleteChip, PeakChip } from "@/components/rankings/review-card"
import { ReviewText } from "@/components/rankings/review-text"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
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

/** A 0–10 meter for one Metric; negative Scores render as an empty bar. */
function ScoreMeter({ label, milli }: { label: string; milli?: number }) {
  const pct = milli === undefined ? 0 : Math.max(0, Math.min(100, milli / 100))
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between font-mono text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">
          {milli !== undefined ? formatScore(milli) : "—"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-well ring-1 ring-border/70 ring-inset">
        <div
          className="h-full rounded-full bg-secondary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

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
      <Link
        to="/rankings"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md font-mono text-xs font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        All rankings
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <div className="relative w-44 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/80 sm:w-56">
          <img
            src={review.artUrl}
            alt={review.title}
            className="aspect-[2/3] size-full object-cover"
          />
          {isPeak(review.scores) && <PeakChip />}
          {review.incomplete && <IncompleteChip />}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
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
          <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">
            {review.title}
          </h1>

          <div className="mt-6 flex flex-col gap-5 rounded-xl border border-border/80 bg-card p-5 sm:flex-row sm:items-center sm:gap-7">
            <div className="shrink-0">
              <p className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Average
              </p>
              <p className="font-mono text-5xl leading-none font-extrabold text-primary tabular-nums">
                {formatAverage(averageScore(review.scores))}
              </p>
            </div>
            <div className="grid flex-1 gap-3.5">
              {METRICS.map((m) => (
                <ScoreMeter
                  key={m.key}
                  label={m.label}
                  milli={review.scores[m.key]}
                />
              ))}
            </div>
          </div>

          {user?.role === "admin" && (
            <div className="mt-5 flex items-center gap-2">
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
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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

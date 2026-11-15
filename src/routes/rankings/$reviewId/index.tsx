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

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

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
      <div className="mb-6">
        <PathCrumb path={`rankings/${slugify(review.title)}`} />
      </div>

      <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-6 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-x-8">
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
        </div>

        <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:self-end">
          <div className="flex items-center gap-5 rounded-xl border border-border/80 bg-card p-4 sm:gap-7 sm:p-5">
            <div className="shrink-0">
              <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Average
              </p>
              <p className="font-mono text-4xl leading-none font-extrabold text-primary tabular-nums sm:text-5xl">
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

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { MetricKey } from "@/lib/rankings"
import type { RankedReview } from "@/server/rankings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatScore, parseScore } from "@/lib/rankings"
import {
  getScoreNeighbors,
  quickUpdateScore,
} from "@/server/rankings"

function NeighborRow({
  item,
  metric,
  onChanged,
}: {
  item: RankedReview
  metric: MetricKey
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function save() {
    setPending(true)
    setError(null)
    try {
      await quickUpdateScore({
        data: { reviewId: item.reviewId, metric, score: value },
      })
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update score")
    } finally {
      setPending(false)
    }
  }

  return (
    <li className="border border-border p-1.5 text-xs">
      <div className="flex items-center gap-2">
        <img
          src={item.artUrl}
          alt=""
          className="aspect-[2/3] w-8 rounded-sm object-cover"
        />
        <span className="min-w-0 flex-1 truncate font-medium">
          {item.title}
        </span>
        {editing ? (
          <>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-7 w-20 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void save()
                if (e.key === "Escape") setEditing(false)
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-7"
              disabled={pending}
              onClick={() => void save()}
            >
              Save
            </Button>
          </>
        ) : (
          <button
            type="button"
            title="Quick-edit score"
            className="rounded px-1.5 py-0.5 font-bold tabular-nums hover:bg-muted"
            onClick={() => {
              setValue(formatScore(item.scores[metric] ?? 0))
              setError(null)
              setEditing(true)
            }}
          >
            {formatScore(item.scores[metric] ?? 0)}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </li>
  )
}

/**
 * The neighbour preview for one Metric: 3 Reviews above and 3 below the
 * entered Score on that Metric's axis, each quick-editable so a taken slot
 * can be freed without leaving the form.
 */
export function ScoreNeighborPreview({
  metric,
  scoreInput,
  excludeReviewId,
}: {
  metric: MetricKey
  scoreInput: string
  excludeReviewId?: string
}) {
  const queryClient = useQueryClient()
  const [debounced, setDebounced] = useState(scoreInput)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(scoreInput), 300)
    return () => clearTimeout(id)
  }, [scoreInput])

  const valid = parseScore(debounced) !== null
  const neighbors = useQuery({
    queryKey: ["scoreNeighbors", metric, debounced, excludeReviewId],
    queryFn: () =>
      getScoreNeighbors({
        data: { metric, score: debounced, excludeReviewId },
      }),
    enabled: valid,
  })

  if (!valid) return null

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["scoreNeighbors"] })
  }

  const above = neighbors.data?.above ?? []
  const below = neighbors.data?.below ?? []

  return (
    <div className="rounded-md border border-dashed border-border p-2">
      <p className="mb-1.5 text-xs text-muted-foreground">
        Would slot between:
      </p>
      {above.length === 0 && below.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No neighbours on this Metric.
        </p>
      ) : (
        <ul className="space-y-1">
          {above.map((item) => (
            <NeighborRow
              key={item.reviewId}
              item={item}
              metric={metric}
              onChanged={refresh}
            />
          ))}
          <li className="py-0.5 text-center text-xs font-bold text-primary">
            ⟵ {formatScore(parseScore(debounced)!)}
          </li>
          {below.map((item) => (
            <NeighborRow
              key={item.reviewId}
              item={item}
              metric={metric}
              onChanged={refresh}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function ProgressBar() {
  const drawnCount = useSelector(
    store,
    (s) => s.gameState?.drawnQuestions.length ?? 0
  )
  const totalQuestions = useSelector(store, (s) => s.questions.length)
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  const percentage =
    totalQuestions > 0 ? (drawnCount / totalQuestions) * 100 : 0

  return (
    <div>
      <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
        <span>Deck</span>
        <span className="tabular-nums">
          {drawnCount} / {totalQuestions} drawn
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-well ring-1 ring-border/70 ring-inset"
        role="progressbar"
        aria-label="Questions drawn"
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
        aria-valuenow={drawnCount}
      >
        <div
          className={`h-full rounded-full bg-secondary ${animationsEnabled ? "transition-[width] duration-500" : ""}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

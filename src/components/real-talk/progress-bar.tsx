import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function ProgressBar() {
  const drawnCount = useSelector(
    store,
    (s) => s.gameState?.drawnQuestions.length ?? 0,
  )
  const totalQuestions = useSelector(store, (s) => s.questions.length)
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  const percentage =
    totalQuestions > 0 ? (drawnCount / totalQuestions) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>
          {drawnCount} / {totalQuestions}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full bg-primary ${animationsEnabled ? "transition-[width] duration-500" : ""}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  )
}

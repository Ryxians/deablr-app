import { useSelector } from "@tanstack/react-store"
import { CurrentTurnCard } from "./current-turn-card"
import { store } from "@/stores/real-talk"

export function QuestionDisplay() {
  const currentQuestion = useSelector(
    store,
    (s) => s.gameState?.currentQuestion
  )
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  return (
    <div className="flex min-h-[230px] flex-col rounded-2xl border border-border/50 bg-card p-5 sm:min-h-[300px] md:min-h-[360px] md:p-7">
      <div className="flex items-center justify-between gap-3">
        <CurrentTurnCard />
        {currentQuestion && (
          <span className="rounded-sm bg-well px-2 py-1 font-mono text-xs font-semibold text-secondary">
            #{currentQuestion.number}
          </span>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center py-6 sm:py-8">
        <p
          key={currentQuestion?.number ?? 0}
          className={
            "max-w-[24ch] text-center text-[1.75rem] leading-snug font-bold text-balance md:text-4xl md:leading-tight " +
            (animationsEnabled
              ? "animate-in duration-500 fade-in slide-in-from-bottom-3"
              : "")
          }
        >
          {currentQuestion?.text}
        </p>
      </div>
    </div>
  )
}

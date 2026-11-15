import { useSelector } from "@tanstack/react-store"
import { RotateCcw } from "lucide-react"
import { MotionToggle } from "./motion-toggle"
import { Button } from "@/components/ui/button"
import { resetGame, store } from "@/stores/real-talk"

export function GameHeader() {
  const roundNumber = useSelector(store, (s) => s.gameState?.roundNumber ?? 0)
  const remainingCount = useSelector(
    store,
    (s) => s.questions.length - (s.gameState?.drawnQuestions.length ?? 0)
  )

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5">
      <div>
        <p className="mb-1.5 font-mono text-xs font-medium text-secondary">
          ~/projects/real-talk
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Real Talk</h1>
        <p className="mt-1.5 font-mono text-xs text-muted-foreground">
          Round {roundNumber} · {remainingCount} questions left
        </p>
      </div>
      <div className="flex items-center gap-1">
        <MotionToggle />
        <Button
          onClick={() => {
            if (window.confirm("End this game and start over?")) resetGame()
          }}
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <RotateCcw />
          New game
        </Button>
      </div>
    </div>
  )
}

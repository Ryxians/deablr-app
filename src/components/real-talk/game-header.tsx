import { BrainCircuit, CircleDot, Sparkles, Trash2, Zap, ZapOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSelector } from "@tanstack/react-store"
import { store, toggleAnimations, resetGame } from "@/stores/real-talk"

export function GameHeader() {
  const roundNumber = useSelector(store, (s) => s.gameState?.roundNumber ?? 0)
  const remainingCount = useSelector(
    store,
    (s) => s.questions.length - (s.gameState?.drawnQuestions.length ?? 0),
  )
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="size-6 text-primary" />
          Real Talk
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <CircleDot className="size-3.5" />
            Round {roundNumber}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <BrainCircuit className="size-3.5" />
            {remainingCount} remaining
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleAnimations}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          title={animationsEnabled ? "Disable animations" : "Enable animations"}
        >
          {animationsEnabled ? (
            <ZapOff className="size-4" />
          ) : (
            <Zap className="size-4" />
          )}
        </Button>
        <Button
          onClick={resetGame}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4 mr-1.5" />
          Reset
        </Button>
      </div>
    </div>
  )
}

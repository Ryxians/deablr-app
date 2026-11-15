import { useSelector } from "@tanstack/react-store"
import { RotateCcw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { resetGame, store } from "@/stores/real-talk"

export function GameHeader() {
  const roundNumber = useSelector(store, (s) => s.gameState?.roundNumber ?? 0)
  const remainingCount = useSelector(
    store,
    (s) => s.questions.length - (s.gameState?.drawnQuestions.length ?? 0)
  )

  return (
    <PageHeader
      path="projects/real-talk"
      title="Real Talk"
      inlineActions
      description={
        <span className="font-mono text-sm">
          Round {roundNumber} · {remainingCount} left
        </span>
      }
      actions={
        <Button
          onClick={() => {
            if (window.confirm("End this game and start over?")) resetGame()
          }}
          variant="ghost-destructive"
          size="sm"
        >
          <RotateCcw />
          New game
        </Button>
      }
    />
  )
}

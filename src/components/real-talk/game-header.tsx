import { useSelector } from "@tanstack/react-store"
import { RotateCcw } from "lucide-react"
import { MotionToggle } from "./motion-toggle"
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
      description={
        <span className="font-mono text-sm">
          Round {roundNumber} · {remainingCount} questions left
        </span>
      }
      actions={
        <>
          <MotionToggle showLabel className="-ml-3 sm:ml-0" />
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
        </>
      }
    />
  )
}

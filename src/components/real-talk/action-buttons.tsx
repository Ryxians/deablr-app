import { ArrowRight, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSelector } from "@tanstack/react-store"
import { store, drawQuestion, nextPlayer } from "@/stores/real-talk"

export function ActionButtons() {
  const remainingCount = useSelector(
    store,
    (s) => s.questions.length - (s.gameState?.drawnQuestions.length ?? 0),
  )
  const hasCurrentQuestion = useSelector(
    store,
    (s) => s.gameState?.currentQuestion != null,
  )

  return (
    <div className="flex gap-3">
      <Button
        onClick={drawQuestion}
        variant="outline"
        className="flex-1 h-12"
        size="lg"
        disabled={remainingCount === 0}
      >
        <Shuffle className="size-4 mr-2" />
        Draw New
      </Button>
      <Button
        onClick={nextPlayer}
        className="flex-1 h-12"
        size="lg"
        disabled={!hasCurrentQuestion}
      >
        Next Player
        <ArrowRight className="size-4 ml-2" />
      </Button>
    </div>
  )
}

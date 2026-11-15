import { useSelector } from "@tanstack/react-store"
import { ArrowRight, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { drawQuestion, nextPlayer, store } from "@/stores/real-talk"

export function ActionButtons() {
  const remainingCount = useSelector(
    store,
    (s) => s.questions.length - (s.gameState?.drawnQuestions.length ?? 0)
  )
  const hasCurrentQuestion = useSelector(
    store,
    (s) => s.gameState?.currentQuestion != null
  )

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        onClick={drawQuestion}
        variant="outline"
        size="lg"
        disabled={remainingCount === 0}
      >
        <Shuffle />
        Redraw
      </Button>
      <Button onClick={nextPlayer} size="lg" disabled={!hasCurrentQuestion}>
        Next player
        <ArrowRight />
      </Button>
    </div>
  )
}

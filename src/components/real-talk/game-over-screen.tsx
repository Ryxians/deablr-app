import { Sparkles, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useSelector } from "@tanstack/react-store"
import { store, resetGame } from "@/stores/real-talk"

export function GameOverScreen() {
  const drawnCount = useSelector(
    store,
    (s) => s.gameState?.drawnQuestions.length ?? 0,
  )
  const players = useSelector(store, (s) => s.gameState?.players ?? [])
  const roundNumber = useSelector(store, (s) => s.gameState?.roundNumber ?? 0)
  const totalQuestions = useSelector(store, (s) => s.questions.length)

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-2">
          <Sparkles className="size-6 md:size-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">Game Over</h1>
        <p className="text-muted-foreground">
          All {totalQuestions} questions have been drawn!
        </p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="space-y-8 py-8">
          <div className="text-center space-y-2">
            <div className="text-7xl font-bold text-primary">{drawnCount}</div>
            <p className="text-muted-foreground">questions drawn</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-center">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Players
              </Label>
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((player) => (
                  <div
                    key={player}
                    className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
                  >
                    {player}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Rounds Completed
              </Label>
              <p className="text-3xl font-bold">{roundNumber}</p>
            </div>
          </div>

          <Button
            onClick={resetGame}
            variant="destructive"
            className="w-full h-12"
            size="lg"
          >
            <RotateCcw className="size-4 mr-2" />
            Start New Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

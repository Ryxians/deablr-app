import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function CurrentTurnCard() {
  const players = useSelector(store, (s) => s.gameState?.players ?? [])
  const shuffledOrder = useSelector(
    store,
    (s) => s.gameState?.shuffledOrder ?? [],
  )
  const currentPlayerIndex = useSelector(
    store,
    (s) => s.gameState?.currentPlayerIndex ?? 0,
  )

  const currentPlayer = players[shuffledOrder[currentPlayerIndex]] ?? null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-base text-muted-foreground font-normal">
          {currentPlayer ? (
            <span>
              It&apos;s{" "}
              <span className="text-primary font-bold text-base md:text-lg">
                {currentPlayer}
              </span>
              &apos;s turn
            </span>
          ) : (
            "Waiting..."
          )}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

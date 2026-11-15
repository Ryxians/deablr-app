import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

/** "Marcus is up" — names whoever answers the card below. */
export function CurrentTurnCard() {
  const currentPlayer = useSelector(store, (s) => {
    const g = s.gameState
    if (!g) return null
    return g.players[g.shuffledOrder[g.currentPlayerIndex]] ?? null
  })

  if (!currentPlayer) return null
  return (
    <p className="font-mono text-sm text-muted-foreground">
      <span className="text-lg font-bold text-primary">{currentPlayer}</span> is
      up
    </p>
  )
}

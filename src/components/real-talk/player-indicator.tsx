import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function PlayerIndicator() {
  const players = useSelector(store, (s) => s.gameState?.players ?? [])
  const shuffledOrder = useSelector(
    store,
    (s) => s.gameState?.shuffledOrder ?? [],
  )
  const currentPlayerIndex = useSelector(
    store,
    (s) => s.gameState?.currentPlayerIndex ?? 0,
  )
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {players.map((player, index) => {
        const isCurrent = shuffledOrder[currentPlayerIndex] === index
        return (
          <div
            key={player}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${animationsEnabled ? "transition-colors duration-300" : ""} ${isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}`}
          >
            {player}
            {isCurrent && (
              <span
                className={`ml-1.5 inline-block ${animationsEnabled ? "animate-pulse" : ""}`}
              >
                ●
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

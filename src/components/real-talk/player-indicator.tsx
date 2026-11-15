import { useSelector } from "@tanstack/react-store"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { store } from "@/stores/real-talk"

/** This round's turn order; the current player is highlighted. */
export function PlayerIndicator() {
  const players = useSelector(store, (s) => s.gameState?.players ?? [])
  const shuffledOrder = useSelector(
    store,
    (s) => s.gameState?.shuffledOrder ?? []
  )
  const currentPlayerIndex = useSelector(
    store,
    (s) => s.gameState?.currentPlayerIndex ?? 0
  )

  return (
    <ol aria-label="Turn order" className="flex flex-wrap items-center gap-2">
      {shuffledOrder.map((playerIndex, position) => {
        const isCurrent = position === currentPlayerIndex
        const isDone = position < currentPlayerIndex
        return (
          <li
            key={players[playerIndex]}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
              isCurrent
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-well/50 text-muted-foreground",
              isDone && "opacity-60"
            )}
          >
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full font-mono text-[11px]",
                isCurrent ? "bg-primary-foreground/15" : "bg-muted"
              )}
            >
              {isDone ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                position + 1
              )}
            </span>
            {players[playerIndex]}
          </li>
        )
      })}
    </ol>
  )
}

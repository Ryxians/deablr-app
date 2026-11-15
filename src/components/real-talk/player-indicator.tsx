import { useSelector } from "@tanstack/react-store"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { store } from "@/stores/real-talk"

/** This round's turn order; the current player is highlighted. */
export function PlayerIndicator({ vertical = false }: { vertical?: boolean }) {
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
    <ol
      aria-label="Turn order"
      className={cn(
        vertical
          ? "flex flex-col gap-2"
          : "-mx-4 flex items-center gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,#000_85%,transparent)] px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:[mask-image:none] sm:px-0"
      )}
    >
      {shuffledOrder.map((playerIndex, position) => {
        const isCurrent = position === currentPlayerIndex
        const isDone = position < currentPlayerIndex
        return (
          <li
            key={players[playerIndex]}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
              vertical && "w-full",
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

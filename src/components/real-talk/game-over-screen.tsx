import { useSelector } from "@tanstack/react-store"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resetGame, store } from "@/stores/real-talk"

export function GameOverScreen() {
  const drawnCount = useSelector(
    store,
    (s) => s.gameState?.drawnQuestions.length ?? 0
  )
  const players = useSelector(store, (s) => s.gameState?.players ?? [])
  const roundNumber = useSelector(store, (s) => s.gameState?.roundNumber ?? 0)

  const stats = [
    { label: "Questions", value: drawnCount },
    { label: "Rounds", value: roundNumber },
    { label: "Players", value: players.length },
  ]

  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-xs font-medium text-secondary">
        ~/projects/real-talk
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
        That&apos;s the whole deck.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Every question has been drawn. Hope it got real.
      </p>

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/80 bg-card px-3 py-5"
          >
            <dd className="font-mono text-3xl font-extrabold text-primary tabular-nums md:text-4xl">
              {stat.value}
            </dd>
            <dt className="mt-1 font-mono text-xs text-muted-foreground">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>

      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {players.map((player) => (
          <li
            key={player}
            className="rounded-full border border-border bg-well/60 px-3 py-1 text-sm font-semibold"
          >
            {player}
          </li>
        ))}
      </ul>

      <Button onClick={resetGame} size="lg" className="mt-8 w-full sm:w-auto">
        <RotateCcw />
        Start a new game
      </Button>
    </div>
  )
}

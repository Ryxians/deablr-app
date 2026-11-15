import { useSelector } from "@tanstack/react-store"
import { RotateCcw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
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
    <div>
      <PageHeader
        path="projects/real-talk"
        title="That's the whole deck."
        description="Every question has been drawn. Hope it got real."
      />
      <div className="max-w-2xl">
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col-reverse rounded-xl border border-border/50 bg-card px-4 py-5"
            >
              <dt className="mt-1 font-mono text-xs text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="font-mono text-3xl font-extrabold text-primary tabular-nums md:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Players">
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
    </div>
  )
}

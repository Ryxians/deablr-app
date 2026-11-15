import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function DrawnHistory() {
  const drawnQuestions = useSelector(
    store,
    (s) => s.gameState?.drawnQuestions ?? []
  )

  if (drawnQuestions.length <= 1) return null

  return (
    <div>
      <p className="mb-2 font-mono text-xs text-muted-foreground">
        Drawn so far
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {drawnQuestions.map((num) => (
          <li
            key={num}
            className="rounded-sm bg-well px-2 py-1 font-mono text-xs text-muted-foreground"
          >
            #{num}
          </li>
        ))}
      </ul>
    </div>
  )
}

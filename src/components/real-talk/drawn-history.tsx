import { Label } from "@/components/ui/label"
import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function DrawnHistory() {
  const drawnQuestions = useSelector(
    store,
    (s) => s.gameState?.drawnQuestions ?? [],
  )

  if (drawnQuestions.length <= 1) return null

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        Drawn so far ({drawnQuestions.length})
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {drawnQuestions.map((num) => (
          <span
            key={num}
            className="px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground font-mono"
          >
            #{num}
          </span>
        ))}
      </div>
    </div>
  )
}

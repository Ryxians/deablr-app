import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function LoadingScreen() {
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  return (
    <div className="flex items-center justify-center py-20">
      <div
        className={`text-muted-foreground ${animationsEnabled ? "animate-pulse" : ""}`}
      >
        Loading questions...
      </div>
    </div>
  )
}

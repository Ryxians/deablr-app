import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 font-mono text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Shuffling the deck…
    </div>
  )
}

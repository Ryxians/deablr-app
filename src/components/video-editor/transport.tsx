import { Pause, Play, Volume2, VolumeX } from "lucide-react"
import { usePlayerPlaying, usePlayerTime } from "./player-store"
import { formatTime } from "./timeline-math"
import type { PlayerStore } from "./player-store"
import { Button } from "@/components/ui/button"

interface TransportProps {
  store: PlayerStore
  /** Output length in seconds. */
  duration: number
  muted: boolean
  onMutedChange: (muted: boolean) => void
}

/** Play/pause, position and mute for the preview, on the output timeline. */
export function Transport({
  store,
  duration,
  muted,
  onMutedChange,
}: TransportProps) {
  const time = usePlayerTime(store)
  const playing = usePlayerPlaying(store)

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-2 py-1.5 sm:gap-3 sm:px-3">
      <Button
        type="button"
        size="icon"
        aria-label={playing ? "Pause" : "Play"}
        aria-keyshortcuts="Space"
        onClick={store.toggle}
        className="rounded-full"
      >
        {playing ? (
          <Pause className="fill-current" />
        ) : (
          <Play className="ml-0.5 fill-current" />
        )}
      </Button>
      <span className="font-mono text-xs whitespace-nowrap tabular-nums">
        {formatTime(time, true)}
        {/* Phones show the total on the timeline instead, to give the
            scrubber room. */}
        <span className="hidden text-muted-foreground sm:inline">
          {" / "}
          {formatTime(duration, true)}
        </span>
      </span>
      <input
        type="range"
        aria-label="Position"
        min={0}
        max={duration || 1}
        step={0.01}
        value={Math.min(time, duration || 1)}
        onChange={(e) => store.seek(Number.parseFloat(e.target.value))}
        className="h-2 min-w-0 flex-1 cursor-pointer accent-primary"
        style={{ touchAction: "pan-y" }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
        onClick={() => onMutedChange(!muted)}
      >
        {muted ? <VolumeX /> : <Volume2 />}
      </Button>
    </div>
  )
}

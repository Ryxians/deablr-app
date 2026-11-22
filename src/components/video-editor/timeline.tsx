import { Film, Layers, Music, Plus } from "lucide-react"
import { useRef } from "react"
import { startDrag } from "./drag"
import { usePlayerTime } from "./player-store"
import { clamp, clampStart, formatTime, trackLength } from "./timeline-math"
import { TRACK_KINDS } from "./track-kinds"
import type { PlayerStore } from "./player-store"
import type { AudioTrack, Track, VideoLayer } from "./types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TimelineProps {
  store: PlayerStore
  /** Output length in seconds. */
  duration: number
  mainName: string
  layers: Array<VideoLayer>
  audioTracks: Array<AudioTrack>
  /** null = the main video is selected. */
  selectedId: string | null
  onSelect: (id: string | null) => void
  onStartChange: (id: string, start: number) => void
  onAddLayer: () => void
  onAddAudio: () => void
}

const TICK_STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800]

/** Within this share of the timeline, a dragged clip snaps to 0/playhead. */
const SNAP = 0.015

const TONES = {
  main: "bg-primary/25 text-foreground ring-primary/70",
  video: "bg-secondary/25 text-foreground ring-secondary/70",
  audio: "bg-accent/20 text-foreground ring-accent/70",
} as const

export function Timeline({
  store,
  duration,
  mainName,
  layers,
  audioTracks,
  selectedId,
  onSelect,
  onStartChange,
  onAddLayer,
  onAddAudio,
}: TimelineProps) {
  const lanesRef = useRef<HTMLDivElement | null>(null)
  const total = duration || 1
  const step = TICK_STEPS.find((s) => total / s <= 6) ?? 3600
  const ticks = Array.from(
    { length: Math.floor(total / step) + 1 },
    (_, i) => i * step
  )

  const timeAt = (clientX: number) => {
    const rect = lanesRef.current!.getBoundingClientRect()
    return clamp(((clientX - rect.left) / rect.width) * total, 0, total)
  }

  /** Press-and-drag on the ruler or an empty lane scrubs the playhead. */
  const onScrubDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.button !== 0) return
    // On touch, lanes must let the page scroll; they seek on tap instead.
    if (e.pointerType === "touch" && e.currentTarget.dataset.lane) return
    const x0 = e.clientX
    store.seek(timeAt(x0))
    startDrag(e, (dx) => store.seek(timeAt(x0 + dx)))
  }

  const onLaneTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) store.seek(timeAt(e.clientX))
  }

  const onClipDown =
    (track: Track) => (e: React.PointerEvent<HTMLButtonElement>) => {
      onSelect(track.id)
      const width = lanesRef.current!.getBoundingClientRect().width
      const orig = track.start
      startDrag(e, (dx) => {
        let start = orig + (dx / width) * total
        for (const target of [0, store.time]) {
          if (Math.abs(start - target) < total * SNAP) start = target
        }
        onStartChange(track.id, clampStart(start, total))
      })
    }

  const onClipKeyDown =
    (track: Track) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const delta = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0
      if (!delta) return
      e.preventDefault()
      const start = track.start + delta * (e.shiftKey ? 1 : 0.1)
      onStartChange(track.id, clampStart(start, total))
    }

  // Front-most layer on top, like the stacking order on screen.
  const rows: Array<
    | { kind: "main"; code: string }
    | { kind: "video" | "audio"; code: string; track: Track }
  > = [
    ...[...layers]
      .map((track, i) => ({ kind: "video" as const, code: `V${i + 2}`, track }))
      .reverse(),
    { kind: "main", code: "V1" },
    ...audioTracks.map((track, i) => ({
      kind: "audio" as const,
      code: `A${i + 1}`,
      track,
    })),
  ]

  return (
    <section
      aria-label="Timeline"
      className="space-y-3 rounded-xl border border-border/50 bg-card p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-sm font-bold">Timeline</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddLayer}
          >
            <Plus />
            <Layers />
            Video layer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddAudio}
          >
            <Plus />
            <Music />
            Audio
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Row codes; spacer matches the ruler height. */}
        <div aria-hidden className="flex w-8 shrink-0 flex-col gap-1.5">
          <div className="h-8 md:h-6" />
          {rows.map((row) => (
            <div
              key={row.kind === "main" ? "main" : row.track.id}
              className="grid h-10 place-items-center rounded-md bg-well font-mono text-[11px] font-bold text-muted-foreground"
            >
              {row.code}
            </div>
          ))}
        </div>

        <div ref={lanesRef} className="relative min-w-0 flex-1">
          <div
            onPointerDown={onScrubDown}
            className="relative h-8 cursor-pointer touch-none border-b border-border/60 select-none md:h-6"
          >
            {ticks.map((t) => (
              <span
                key={t}
                className="pointer-events-none absolute bottom-0 h-2 w-px bg-border"
                style={{ left: `${(t / total) * 100}%` }}
              >
                <span
                  className={cn(
                    "absolute bottom-2 font-mono text-[10px] text-muted-foreground tabular-nums",
                    t === 0 ? "left-0.5" : "-translate-x-1/2",
                    t / total > 0.92 && "hidden"
                  )}
                >
                  {formatTime(t)}
                </span>
              </span>
            ))}
          </div>

          <div className="mt-1.5 flex flex-col gap-1.5">
            {rows.map((row) => {
              if (row.kind === "main") {
                const selected = selectedId === null
                return (
                  <div
                    key="main"
                    className="relative h-10 rounded-md bg-well/70"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(null)}
                      aria-pressed={selected}
                      className={cn(
                        "absolute inset-0 flex items-center gap-1.5 overflow-hidden rounded-md px-2 text-left font-mono text-xs font-semibold ring-1 outline-none ring-inset focus-visible:ring-[3px] focus-visible:ring-ring/60",
                        TONES.main,
                        selected && "ring-2"
                      )}
                    >
                      <Film className="size-3.5 shrink-0" />
                      <span className="truncate">{mainName}</span>
                    </button>
                  </div>
                )
              }
              const { track } = row
              const Icon = TRACK_KINDS[row.kind].icon
              const selected = selectedId === track.id
              const length = trackLength(track)
              const late = track.start >= total
              return (
                <div
                  key={track.id}
                  data-lane
                  onPointerDown={onScrubDown}
                  onClick={onLaneTap}
                  className="relative h-10 touch-pan-y overflow-hidden rounded-md bg-well/70"
                >
                  <button
                    type="button"
                    aria-label={`${TRACK_KINDS[row.kind].label} ${track.name}, starts at ${formatTime(track.start, true)}. Arrow keys move it.`}
                    aria-pressed={selected}
                    onPointerDown={onClipDown(track)}
                    onClick={() => onSelect(track.id)}
                    onKeyDown={onClipKeyDown(track)}
                    title={late ? "Starts after the video ends" : undefined}
                    className={cn(
                      "absolute inset-y-0 flex cursor-grab touch-pan-y items-center gap-1.5 overflow-hidden rounded-md px-2 text-left font-mono text-xs font-semibold ring-1 outline-none select-none ring-inset focus-visible:ring-[3px] focus-visible:ring-ring/60 active:cursor-grabbing",
                      TONES[row.kind],
                      selected && "z-10 ring-2",
                      late && "opacity-50"
                    )}
                    style={{
                      left: `${Math.min(track.start / total, 0.97) * 100}%`,
                      width: `max(${(length / total) * 100}%, 1.5rem)`,
                    }}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{track.name}</span>
                  </button>
                </div>
              )
            })}
          </div>

          <Playhead store={store} total={total} />
        </div>
      </div>

      {rows.length === 1 && (
        <p className="text-sm text-muted-foreground">
          Add a video layer for picture-in-picture, or an audio track for music
          or a voiceover. Drag clips along the timeline to change when they
          start.
        </p>
      )}
    </section>
  )
}

/** Subscribes on its own so playback doesn't re-render the lanes. */
function Playhead({ store, total }: { store: PlayerStore; total: number }) {
  const time = usePlayerTime(store)
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-sun"
      style={{ left: `${clamp(time / total, 0, 1) * 100}%` }}
    >
      <span className="absolute -top-0.5 left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-sun" />
    </div>
  )
}

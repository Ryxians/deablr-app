import { ArrowDownToLine, ArrowUpToLine, Check, Trash2 } from "lucide-react"
import { useId } from "react"
import { RangeSlider } from "./range-slider"
import { clamp, clampStart, formatTime, trackLength } from "./timeline-math"
import { TRACK_KINDS } from "./track-kinds"
import type { PlayerStore } from "./player-store"
import type { Track, VideoLayer } from "./types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface TrackInspectorProps {
  track: Track
  store: PlayerStore
  /** Output length in seconds. */
  duration: number
  /** For layers: position in the stack (0 = bottom) and how many there are. */
  layerIndex?: number
  layerCount?: number
  onChange: (patch: Partial<Track>) => void
  onMoveLayer?: (direction: -1 | 1) => void
  onRemove: () => void
  onDone: () => void
}

const fieldLabel = "font-mono text-xs font-semibold"

export function TrackInspector({
  track,
  store,
  duration,
  layerIndex = 0,
  layerCount = 0,
  onChange,
  onMoveLayer,
  onRemove,
  onDone,
}: TrackInspectorProps) {
  const ids = useId()
  const isVideo = track.kind === "video"
  const kind = TRACK_KINDS[track.kind]
  const length = trackLength(track)
  const ends = track.start + length
  const audioOn = !isVideo || track.includeAudio

  return (
    <section
      aria-label={`${kind.label} settings`}
      className="space-y-5 rounded-xl border-2 border-secondary/50 bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-well text-secondary">
            <kind.icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-muted-foreground uppercase">
              {kind.label}
            </p>
            <h3 className="truncate font-mono text-sm font-bold">
              {track.name}
            </h3>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="ghost-destructive"
            size="icon-sm"
            aria-label="Remove"
            onClick={onRemove}
            className="hover:text-destructive"
          >
            <Trash2 />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onDone}>
            <Check />
            Done
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={fieldLabel}>Timing</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                start: clampStart(store.time, duration),
              })
            }
          >
            Start at playhead
          </Button>
        </div>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          Plays{" "}
          <span className="text-foreground">
            {formatTime(track.start, true)} →{" "}
            {formatTime(Math.min(ends, duration), true)}
          </span>{" "}
          on the timeline
          {ends > duration + 0.05 && " (cut off at the end)"}
          {track.start >= duration && " — starts after the video ends"}
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={fieldLabel}>Trim clip</span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatTime(track.trim.start, true)}–
            {formatTime(track.trim.end, true)}{" "}
            <span className="text-foreground">({length.toFixed(1)}s)</span>
          </span>
        </div>
        <RangeSlider
          min={0}
          max={track.duration}
          step={0.1}
          start={track.trim.start}
          end={track.trim.end}
          minGap={0.2}
          labels={["Clip start", "Clip end"]}
          formatValue={(v) => formatTime(v, true)}
          onChange={(start, end) => onChange({ trim: { start, end } })}
        />
      </div>

      {isVideo && (
        <LayerFields
          layer={track}
          index={layerIndex}
          count={layerCount}
          onChange={onChange}
          onMove={onMoveLayer}
        />
      )}

      <div className="space-y-3">
        {isVideo && (
          <div className="flex items-center gap-2.5">
            <Checkbox
              id={`${ids}-audio`}
              checked={track.includeAudio}
              onCheckedChange={(v) => onChange({ includeAudio: v === true })}
            />
            <Label htmlFor={`${ids}-audio`} className="font-mono text-xs">
              Include this clip&apos;s sound
            </Label>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label htmlFor={`${ids}-vol`} className={fieldLabel}>
            Volume
          </label>
          <input
            id={`${ids}-vol`}
            type="range"
            min={0}
            max={1}
            step={0.01}
            disabled={!audioOn}
            value={track.volume}
            onChange={(e) =>
              onChange({ volume: Number.parseFloat(e.target.value) })
            }
            className="h-2 flex-1 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
            style={{ touchAction: "pan-y" }}
          />
          <span className="w-12 text-right font-mono text-xs tabular-nums">
            {Math.round(track.volume * 100)}%
          </span>
        </div>
      </div>
    </section>
  )
}

function LayerFields({
  layer,
  index,
  count,
  onChange,
  onMove,
}: {
  layer: VideoLayer
  index: number
  count: number
  onChange: (patch: Partial<VideoLayer>) => void
  onMove?: (direction: -1 | 1) => void
}) {
  const ids = useId()
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor={`${ids}-size`} className={fieldLabel}>
          Size
        </label>
        <input
          id={`${ids}-size`}
          type="range"
          min={0.08}
          max={1}
          step={0.01}
          value={layer.w}
          onChange={(e) => {
            const w = Number.parseFloat(e.target.value)
            // Grow from the centre, then keep it inside the frame.
            const x = clamp(layer.x - (w - layer.w) / 2, 0, Math.max(0, 1 - w))
            onChange({ w, x })
          }}
          className="h-2 flex-1 cursor-pointer accent-primary"
          style={{ touchAction: "pan-y" }}
        />
        <span className="w-12 text-right font-mono text-xs tabular-nums">
          {Math.round(layer.w * 100)}%
        </span>
      </div>
      {count > 1 && onMove && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowUpToLine />
            Bring forward
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowDownToLine />
            Send back
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Drag the layer on the video to move it, or its corner dot to resize.
      </p>
    </div>
  )
}

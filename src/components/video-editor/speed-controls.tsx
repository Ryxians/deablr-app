import { RotateCcw } from "lucide-react"
import { useId } from "react"
import { DEFAULT_SPEED, MAX_SPEED, MIN_SPEED, SPEED_PRESETS } from "./types"
import { formatTime } from "./timeline-math"
import { togglePill } from "./toggle-pill"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The slider is piecewise-linear so 1× sits dead centre: the left half covers
 * 0.5×–1× and the right half 1×–3×. A plain linear track would squeeze every
 * slow-motion speed into the first fifth.
 */
const TRACK_MAX = 100
const TRACK_MID = TRACK_MAX / 2
/** Positions this close to the centre snap to 1× so "normal" is easy to hit. */
const SNAP_RADIUS = 2

const TICKS = [0.5, 0.75, 1, 2, 3] as const

export function speedToPosition(speed: number) {
  if (speed <= 1) {
    return ((speed - MIN_SPEED) / (1 - MIN_SPEED)) * TRACK_MID
  }
  return TRACK_MID + ((speed - 1) / (MAX_SPEED - 1)) * TRACK_MID
}

export function positionToSpeed(position: number) {
  if (Math.abs(position - TRACK_MID) <= SNAP_RADIUS) return DEFAULT_SPEED
  const raw =
    position <= TRACK_MID
      ? MIN_SPEED + (position / TRACK_MID) * (1 - MIN_SPEED)
      : 1 + ((position - TRACK_MID) / TRACK_MID) * (MAX_SPEED - 1)
  const rounded = Math.round(raw * 100) / 100
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, rounded))
}

export function formatSpeed(speed: number) {
  return `${Number(speed.toFixed(2))}×`
}

interface SpeedControlsProps {
  speed: number
  /** Length of the source video in seconds; 0 until metadata loads. */
  duration: number
  onChange: (speed: number) => void
}

export function SpeedControls({
  speed,
  duration,
  onChange,
}: SpeedControlsProps) {
  const labelId = useId()
  const changed = speed !== DEFAULT_SPEED
  const hasDuration = Number.isFinite(duration) && duration > 0

  return (
    <section
      aria-labelledby={labelId}
      className="space-y-4 rounded-xl border border-border/50 bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h3 id={labelId} className="font-mono text-sm font-bold">
            Speed
          </h3>
          <output
            aria-live="polite"
            className="font-mono text-2xl font-extrabold text-primary tabular-nums"
          >
            {formatSpeed(speed)}
          </output>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!changed}
          onClick={() => onChange(DEFAULT_SPEED)}
        >
          <RotateCcw />
          Reset
        </Button>
      </div>

      <div>
        <input
          type="range"
          min={0}
          max={TRACK_MAX}
          step={1}
          value={speedToPosition(speed)}
          onChange={(e) =>
            onChange(positionToSpeed(Number.parseFloat(e.target.value)))
          }
          onDoubleClick={() => onChange(DEFAULT_SPEED)}
          aria-labelledby={labelId}
          aria-valuetext={formatSpeed(speed)}
          className="h-2 w-full cursor-pointer accent-primary"
          style={{ touchAction: "pan-y" }}
        />
        {/* Tick labels line up with the thumb centre (native thumb ≈ 16px). */}
        <div aria-hidden className="relative mt-1 h-4">
          {TICKS.map((tick) => (
            <span
              key={tick}
              className={
                "absolute -translate-x-1/2 font-mono text-[11px] tabular-nums " +
                (tick === 1
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground")
              }
              style={{
                left: `calc(8px + (100% - 16px) * ${speedToPosition(tick) / TRACK_MAX})`,
              }}
            >
              {formatSpeed(tick)}
            </span>
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-label="Speed presets"
        className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap"
      >
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={speed === preset}
            onClick={() => onChange(preset)}
            className={cn(togglePill, "sm:min-w-14")}
          >
            {formatSpeed(preset)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
        <span>
          Length{" "}
          {hasDuration ? (
            changed ? (
              <>
                <span className="tabular-nums line-through decoration-muted-foreground/60">
                  {formatTime(duration)}
                </span>{" "}
                →{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatTime(duration / speed)}
                </span>
              </>
            ) : (
              <span className="text-foreground tabular-nums">
                {formatTime(duration)}
              </span>
            )
          ) : (
            "—"
          )}
        </span>
        <span>
          {changed
            ? "Pitch is kept. Export re-encodes video, so it takes longer."
            : "Pitch is kept at any speed."}
        </span>
      </div>
    </section>
  )
}

import { useRef } from "react"
import { clamp } from "./timeline-math"
import { cn } from "@/lib/utils"

type Handle = "start" | "end"

interface RangeSliderProps {
  min: number
  max: number
  step: number
  start: number
  end: number
  /** Smallest allowed gap between the two handles. */
  minGap?: number
  /** Accessible names for the two handles. */
  labels: [string, string]
  formatValue: (value: number) => string
  /** `handle` is the one that moved, so callers can preview that frame. */
  onChange: (start: number, end: number, handle: Handle) => void
  onCommit?: () => void
  className?: string
}

/** Thumb diameter; the rail is inset by half of it on each side. */
const THUMB = 24

/**
 * A two-handle slider for picking a span. Press anywhere on the rail to grab
 * the nearest handle; arrow keys nudge (Shift for 10×), Home/End jump.
 */
export function RangeSlider({
  min,
  max,
  step,
  start,
  end,
  minGap = step,
  labels,
  formatValue,
  onChange,
  onCommit,
  className,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const span = max - min || 1
  const pct = (v: number) => (clamp(v, min, max) - min) / span

  const setHandle = (handle: Handle, raw: number) => {
    const value = Math.round(raw / step) * step
    if (handle === "start") {
      onChange(clamp(value, min, end - minGap), end, "start")
    } else {
      onChange(start, clamp(value, start + minGap, max), "end")
    }
  }

  const valueAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect()
    const usable = rect.width - THUMB
    return min + clamp((clientX - rect.left - THUMB / 2) / usable, 0, 1) * span
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    const value = valueAt(e.clientX)
    // Grab the nearer handle; when they overlap, pick by which side you hit.
    const handle: Handle =
      value <= start
        ? "start"
        : value >= end
          ? "end"
          : value - start < end - value
            ? "start"
            : "end"
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    el.querySelector<HTMLElement>(`[data-handle="${handle}"]`)?.focus()
    setHandle(handle, value)
    const move = (ev: PointerEvent) => setHandle(handle, valueAt(ev.clientX))
    const up = () => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
      onCommit?.()
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)
  }

  const onKeyDown = (handle: Handle) => (e: React.KeyboardEvent) => {
    const current = handle === "start" ? start : end
    const big = step * 10
    const next =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? current - (e.shiftKey ? big : step)
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? current + (e.shiftKey ? big : step)
          : e.key === "PageDown"
            ? current - big
            : e.key === "PageUp"
              ? current + big
              : e.key === "Home"
                ? min
                : e.key === "End"
                  ? max
                  : null
    if (next === null) return
    e.preventDefault()
    setHandle(handle, next)
    onCommit?.()
  }

  const left = (v: number) =>
    `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${pct(v)})`

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      className={cn(
        "relative h-11 cursor-pointer touch-none select-none",
        className
      )}
    >
      <div
        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted"
        style={{ left: THUMB / 2, right: THUMB / 2 }}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-primary"
          style={{
            left: `${pct(start) * 100}%`,
            right: `${(1 - pct(end)) * 100}%`,
          }}
        />
      </div>
      {(["start", "end"] as const).map((handle, i) => {
        const value = handle === "start" ? start : end
        return (
          <div
            key={handle}
            role="slider"
            tabIndex={0}
            data-handle={handle}
            aria-label={labels[i]}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={Number(value.toFixed(2))}
            aria-valuetext={formatValue(value)}
            onKeyDown={onKeyDown(handle)}
            className="absolute top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground shadow-lift ring-4 ring-primary outline-none focus-visible:ring-[6px] focus-visible:ring-ring/70"
            style={{ left: left(value) }}
          >
            <span className="h-2.5 w-0.5 rounded-full bg-primary" />
          </div>
        )
      })}
    </div>
  )
}

import {
  Activity,
  AudioLines,
  Crop,
  Gauge,
  RotateCcw,
  Scissors,
} from "lucide-react"
import { useId, useRef } from "react"
import { EQControls } from "./eq-controls"
import { isTrimmed } from "./export-plan"
import { togglePill } from "./toggle-pill"
import { RangeSlider } from "./range-slider"
import { SpeedControls } from "./speed-controls"
import { ASPECTS, cropPixels, formatTime, isFullCrop } from "./timeline-math"
import type { PlayerStore } from "./player-store"
import type { AspectId } from "./timeline-math"
import type { CropRect, EQBand, SourceInfo, TimeRange } from "./types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ToolTab = "trim" | "crop" | "speed" | "sound"

const TABS: Array<{ id: ToolTab; label: string; icon: typeof Scissors }> = [
  { id: "trim", label: "Trim", icon: Scissors },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "speed", label: "Speed", icon: Gauge },
  { id: "sound", label: "Sound", icon: AudioLines },
]

interface EditorToolsProps {
  tab: ToolTab
  onTabChange: (tab: ToolTab) => void
  store: PlayerStore
  source: SourceInfo
  trim: TimeRange
  onTrimChange: (trim: TimeRange) => void
  crop: CropRect
  aspect: AspectId
  onAspectChange: (aspect: AspectId) => void
  onCropReset: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  bands: Array<EQBand>
  onBandsChange: (bands: Array<EQBand>) => void
  volume: number
  onVolumeChange: (volume: number) => void
  onSoundReset: () => void
  showLiveEQ: boolean
  onShowLiveEQChange: (show: boolean) => void
  compare: boolean
  onCompareChange: (compare: boolean) => void
}

/** Edits that apply to the main video, grouped into tabs. */
export function EditorTools(props: EditorToolsProps) {
  const { tab, onTabChange } = props
  const ids = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (index + delta + TABS.length) % TABS.length
    onTabChange(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section className="space-y-4">
      <div
        role="tablist"
        aria-label="Main video tools"
        className="grid grid-cols-4 gap-1 rounded-xl bg-well p-1"
      >
        {TABS.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${ids}-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`${ids}-panel`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => onTabChange(id)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
            className={cn(
              "flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg font-mono text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:h-10 md:text-[13px]",
              tab === id
                ? "bg-card text-foreground shadow-lift ring-1 ring-primary/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${ids}-panel`}
        aria-labelledby={`${ids}-tab-${tab}`}
      >
        {tab === "trim" && <TrimPanel {...props} />}
        {tab === "crop" && <CropPanel {...props} />}
        {tab === "speed" && (
          <SpeedControls
            speed={props.speed}
            duration={props.trim.end - props.trim.start}
            onChange={props.onSpeedChange}
          />
        )}
        {tab === "sound" && <SoundPanel {...props} />}
      </div>
    </section>
  )
}

const card = "space-y-4 rounded-xl border border-border/50 bg-card p-4"

function TrimPanel({ store, source, trim, onTrimChange }: EditorToolsProps) {
  const full = !isTrimmed({ trim, source })
  const sourceNow = () => store.video?.currentTime ?? 0
  const lastHandle = useRef<"start" | "end">("start")

  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h3 className="font-mono text-sm font-bold">Trim</h3>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatTime(trim.start, true)} – {formatTime(trim.end, true)}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={full}
          onClick={() => onTrimChange({ start: 0, end: source.duration })}
        >
          <RotateCcw />
          Reset
        </Button>
      </div>

      <RangeSlider
        min={0}
        max={source.duration}
        step={0.05}
        start={trim.start}
        end={trim.end}
        minGap={0.2}
        labels={["Trim start", "Trim end"]}
        formatValue={(v) => formatTime(v, true)}
        onChange={(start, end, handle) => {
          onTrimChange({ start, end })
          lastHandle.current = handle
          // Show the frame under the handle you're dragging.
          store.previewSourceTime(handle === "start" ? start : end)
        }}
        // Once the new trim has rendered, park the playhead on the edge you
        // moved so play continues from a sensible spot.
        onCommit={() =>
          requestAnimationFrame(() =>
            store.seek(lastHandle.current === "start" ? 0 : store.duration)
          )
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const t = Math.min(sourceNow(), trim.end - 0.2)
            onTrimChange({ start: Math.max(0, t), end: trim.end })
          }}
        >
          Start here
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const t = Math.max(sourceNow(), trim.start + 0.2)
            onTrimChange({
              start: trim.start,
              end: Math.min(source.duration, t),
            })
          }}
        >
          End here
        </Button>
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        Keeps{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {formatTime(trim.end - trim.start, true)}
        </span>{" "}
        of {formatTime(source.duration, true)}. Drag the handles, or play to a
        moment and set the start or end there.
      </p>
    </div>
  )
}

function CropPanel({
  source,
  crop,
  aspect,
  onAspectChange,
  onCropReset,
}: EditorToolsProps) {
  const px = cropPixels(crop, source)
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h3 className="font-mono text-sm font-bold">Crop</h3>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {px.w}×{px.h}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFullCrop(crop) && aspect === "free"}
          onClick={onCropReset}
        >
          <RotateCcw />
          Reset
        </Button>
      </div>
      <div
        role="group"
        aria-label="Aspect ratio"
        className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap"
      >
        {ASPECTS.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-pressed={aspect === a.id}
            onClick={() => onAspectChange(a.id)}
            className={cn(togglePill, "sm:min-w-16")}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Drag the box on the video to move it, or its corners to resize. With a
        keyboard, focus the box and use the arrow keys (Shift to resize). Layers
        are hidden while you crop.
      </p>
    </div>
  )
}

function SoundPanel({
  bands,
  onBandsChange,
  volume,
  onVolumeChange,
  onSoundReset,
  showLiveEQ,
  onShowLiveEQChange,
  compare,
  onCompareChange,
}: EditorToolsProps) {
  const ids = useId()
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={showLiveEQ ? "secondary" : "outline"}
          size="sm"
          aria-pressed={showLiveEQ}
          onClick={() => onShowLiveEQChange(!showLiveEQ)}
        >
          <Activity />
          Live EQ
        </Button>
        <Button
          type="button"
          variant={compare ? "secondary" : "outline"}
          size="sm"
          className="touch-none select-none"
          onPointerDown={() => onCompareChange(true)}
          onPointerUp={() => onCompareChange(false)}
          onPointerLeave={() => onCompareChange(false)}
          onPointerCancel={() => onCompareChange(false)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") onCompareChange(true)
          }}
          onKeyUp={() => onCompareChange(false)}
        >
          {compare ? "Hearing original" : "Hold to compare"}
        </Button>
      </div>

      <EQControls
        bands={bands}
        onChange={onBandsChange}
        onReset={onSoundReset}
      />

      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor={`${ids}-volume`}
            className="font-mono text-xs font-semibold whitespace-nowrap"
          >
            Volume
          </label>
          <input
            id={`${ids}-volume`}
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(Number.parseFloat(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-primary"
            style={{ touchAction: "pan-y" }}
          />
          <span className="w-12 text-right font-mono text-xs tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

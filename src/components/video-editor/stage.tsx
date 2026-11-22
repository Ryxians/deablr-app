import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { EQVisualizer } from "./eq-visualizer"
import { startDrag } from "./drag"
import { formatSpeed } from "./speed-controls"
import {
  clamp,
  cropPixels,
  layerHeightFraction,
  outputDuration,
  resizeCrop,
  sourceToOutput,
  trackTimeAt,
} from "./timeline-math"
import type { PlayerStore } from "./player-store"
import type { Corner } from "./timeline-math"
import type {
  AudioTrack,
  CropRect,
  SourceInfo,
  TimeRange,
  VideoLayer,
} from "./types"
import { cn } from "@/lib/utils"

interface StageProps {
  store: PlayerStore
  src: string
  source: SourceInfo | null
  onSourceInfo: (info: SourceInfo) => void
  onVideoElement: (element: HTMLVideoElement | null) => void
  /** Runs inside the user's play gesture (e.g. resume the AudioContext). */
  onUserPlay: () => void
  trim: TimeRange
  speed: number
  crop: CropRect
  cropEditing: boolean
  /** Pixel aspect ratio the crop is locked to, or null for free. */
  cropRatio: number | null
  onCropChange: (crop: CropRect) => void
  layers: Array<VideoLayer>
  audioTracks: Array<AudioTrack>
  selectedId: string | null
  onSelect: (id: string) => void
  onLayerChange: (id: string, patch: Partial<VideoLayer>) => void
  muted: boolean
  analyser: AnalyserNode | null
  showLiveEQ: boolean
}

const CORNERS: Array<Corner> = ["nw", "ne", "sw", "se"]

/** Preview frames are capped at this much of the viewport height. */
const MAX_STAGE_VH = 62

/**
 * The preview. The main <video> drives the clock; every layer and audio
 * track is a separate media element kept in step with it. In crop mode the
 * full frame is shown with an adjustable crop box; otherwise the frame is
 * shown already cropped, with layers positioned on top.
 */
export function Stage(props: StageProps) {
  const {
    store,
    src,
    source,
    onSourceInfo,
    onVideoElement,
    onUserPlay,
    speed,
    crop,
    cropEditing,
    cropRatio,
    onCropChange,
    layers,
    audioTracks,
    selectedId,
    onSelect,
    onLayerChange,
    muted,
    analyser,
    showLiveEQ,
  } = props
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const mediaRefs = useRef(new Map<string, HTMLMediaElement>())
  const layerBoxRefs = useRef(new Map<string, HTMLDivElement>())
  // The rAF loop reads the latest edits without restarting on every change.
  const latest = useRef(props)
  useLayoutEffect(() => {
    latest.current = props
  })

  /** Bring every layer/track to where it should be for the current frame. */
  const sync = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const { trim, speed: rate, layers: ls, audioTracks: ts } = latest.current
    if (!video.paused && video.currentTime >= trim.end - 0.03) {
      video.pause()
      video.currentTime = trim.end
    }
    const total = outputDuration(trim, rate)
    const out = clamp(sourceToOutput(video.currentTime, trim, rate), 0, total)
    const playing = !video.paused
    store.update(out, playing)

    for (const track of [...ls, ...ts]) {
      const el = mediaRefs.current.get(track.id)
      if (!el) continue
      const { active, fileTime } = trackTimeAt(track, out)
      const box = layerBoxRefs.current.get(track.id)
      if (box) box.dataset.active = String(active && out < total)
      if (el.readyState === 0) continue
      const drift = Math.abs(el.currentTime - fileTime)
      if (active && playing) {
        if (drift > 0.3) el.currentTime = fileTime
        if (el.paused) void el.play().catch(() => {})
      } else {
        if (!el.paused) el.pause()
        if (drift > 0.04) el.currentTime = fileTime
      }
    }
  }, [store])

  // Wire the main video to the store and run the sync loop while playing.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    store.video = video
    onVideoElement(video)
    let frame = 0
    const tick = () => {
      sync()
      if (!video.paused) frame = requestAnimationFrame(tick)
    }
    const onPlay = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(tick)
    }
    const onMeta = () => {
      onSourceInfo({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      })
    }
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", sync)
    video.addEventListener("seeked", sync)
    video.addEventListener("timeupdate", sync)
    video.addEventListener("loadedmetadata", onMeta)
    if (video.readyState >= 1) onMeta()
    return () => {
      cancelAnimationFrame(frame)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", sync)
      video.removeEventListener("seeked", sync)
      video.removeEventListener("timeupdate", sync)
      video.removeEventListener("loadedmetadata", onMeta)
      store.video = null
      onVideoElement(null)
    }
  }, [src, store, sync, onVideoElement, onSourceInfo])

  // Mobile browsers only let media start inside a user gesture, so "unlock"
  // every track on the first play press, then let sync decide who plays.
  useEffect(() => {
    store.onUserPlay = () => {
      onUserPlay()
      for (const el of mediaRefs.current.values()) {
        if (el.paused) {
          void el.play().catch(() => {})
          el.pause()
        }
      }
      sync()
    }
    return () => {
      store.onUserPlay = null
    }
  }, [store, onUserPlay, sync])

  // Re-sync whenever the edit changes (trim, speed, track timing…).
  useEffect(() => {
    store.trim = props.trim
    store.speed = speed
    sync()
  }, [store, props.trim, speed, layers, audioTracks, sync])

  // Loading a new source resets playbackRate to defaultPlaybackRate, so set
  // both. Pitch is preserved to match the atempo filter used on export.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.preservesPitch = true
    video.defaultPlaybackRate = speed
    video.playbackRate = speed
  }, [speed, src])

  useEffect(() => {
    for (const track of [...layers, ...audioTracks]) {
      const el = mediaRefs.current.get(track.id)
      if (!el) continue
      el.volume = clamp(track.volume, 0, 1)
      el.muted = muted || (track.kind === "video" && !track.includeAudio)
    }
  }, [layers, audioTracks, muted])

  // Space toggles playback unless you're typing or on a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " || e.repeat) return
      const target = e.target as HTMLElement | null
      if (
        target?.closest(
          "input, textarea, select, button, a, [role=slider], [role=tab], [contenteditable=true]"
        )
      ) {
        return
      }
      e.preventDefault()
      store.toggle()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [store])

  const setMedia = (id: string) => (el: HTMLMediaElement | null) => {
    if (el) mediaRefs.current.set(id, el)
    else mediaRefs.current.delete(id)
  }
  const setLayerBox = (id: string) => (el: HTMLDivElement | null) => {
    if (el) layerBoxRefs.current.set(id, el)
    else layerBoxRefs.current.delete(id)
  }

  const frame = source ? cropPixels(crop, source) : null
  const ratio =
    !source || !frame
      ? 16 / 9
      : cropEditing
        ? source.width / source.height
        : frame.w / frame.h

  // In view mode the video is scaled/offset so the crop fills the frame.
  const videoStyle: React.CSSProperties =
    cropEditing || !source
      ? { inset: 0, width: "100%", height: "100%" }
      : {
          left: `${(-crop.x / crop.w) * 100}%`,
          top: `${(-crop.y / crop.h) * 100}%`,
          width: `${100 / crop.w}%`,
          height: `${100 / crop.h}%`,
        }

  const frameRect = () => frameRef.current!.getBoundingClientRect()

  const onLayerPointerDown =
    (layer: VideoLayer) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      onSelect(layer.id)
      if (!frame) return
      const rect = frameRect()
      const h = layerHeightFraction(layer, { width: frame.w, height: frame.h })
      startDrag(e, (dx, dy) =>
        onLayerChange(layer.id, {
          x: clamp(layer.x + dx / rect.width, 0, Math.max(0, 1 - layer.w)),
          y: clamp(layer.y + dy / rect.height, 0, Math.max(0, 1 - h)),
        })
      )
    }

  const onLayerResizeDown =
    (layer: VideoLayer) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      onSelect(layer.id)
      if (!frame) return
      const rect = frameRect()
      const hPerW = layerHeightFraction(
        { ...layer, w: 1 },
        { width: frame.w, height: frame.h }
      )
      const maxW = Math.min(1 - layer.x, (1 - layer.y) / hPerW)
      startDrag(e, (dx) =>
        onLayerChange(layer.id, {
          w: clamp(layer.w + dx / rect.width, 0.08, maxW),
        })
      )
    }

  const onLayerKeyDown =
    (layer: VideoLayer) => (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 0.05 : 0.01
      const moves: Partial<Record<string, [number, number]>> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      const move = moves[e.key]
      if (!move || !frame) return
      e.preventDefault()
      const h = layerHeightFraction(layer, { width: frame.w, height: frame.h })
      onLayerChange(layer.id, {
        x: clamp(layer.x + move[0], 0, Math.max(0, 1 - layer.w)),
        y: clamp(layer.y + move[1], 0, Math.max(0, 1 - h)),
      })
    }

  // Crop lock converted from pixel ratio to fraction-of-frame ratio.
  const lock =
    cropRatio && source ? (cropRatio * source.height) / source.width : null

  const onCropBoxDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = frameRect()
    const orig = crop
    startDrag(e, (dx, dy) =>
      onCropChange({
        ...orig,
        x: clamp(orig.x + dx / rect.width, 0, 1 - orig.w),
        y: clamp(orig.y + dy / rect.height, 0, 1 - orig.h),
      })
    )
  }

  const onCropCornerDown =
    (corner: Corner) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      const rect = frameRect()
      const orig = crop
      startDrag(e, (dx, dy) =>
        onCropChange(
          resizeCrop(orig, corner, dx / rect.width, dy / rect.height, lock)
        )
      )
    }

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl bg-black ring-1 ring-border/80"
      style={{
        aspectRatio: ratio,
        width: `min(100%, calc(${MAX_STAGE_VH}vh * ${ratio}))`,
      }}
    >
      <div
        ref={frameRef}
        className="absolute inset-0"
        onClick={cropEditing ? undefined : store.toggle}
      >
        <video
          ref={videoRef}
          src={src}
          className={cn(
            "absolute block max-w-none",
            source ? "object-fill" : "object-contain"
          )}
          style={videoStyle}
          playsInline
          preload="auto"
          muted={muted}
        />

        {layers.map((layer) => {
          const selected = layer.id === selectedId
          return (
            <div
              key={layer.id}
              ref={setLayerBox(layer.id)}
              role="button"
              tabIndex={cropEditing ? -1 : 0}
              aria-label={`Layer ${layer.name}. Drag or use arrow keys to move.`}
              aria-pressed={selected}
              onPointerDown={onLayerPointerDown(layer)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={onLayerKeyDown(layer)}
              className={cn(
                "absolute cursor-move touch-none outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/70",
                cropEditing && "invisible",
                selected
                  ? "z-10 ring-2 ring-secondary data-[active=false]:opacity-40"
                  : "hover:ring-2 hover:ring-secondary/60 data-[active=false]:pointer-events-none data-[active=false]:opacity-0"
              )}
              style={{
                left: `${layer.x * 100}%`,
                top: `${layer.y * 100}%`,
                width: `${layer.w * 100}%`,
              }}
            >
              <video
                ref={setMedia(layer.id)}
                src={layer.url}
                className="pointer-events-none block h-auto w-full"
                playsInline
                preload="auto"
              />
              {selected && (
                <div
                  aria-hidden
                  onPointerDown={onLayerResizeDown(layer)}
                  className="absolute -right-3 -bottom-3 grid size-8 cursor-nwse-resize touch-none place-items-center"
                >
                  <span className="size-3.5 rounded-full bg-secondary ring-2 ring-black/60" />
                </div>
              )}
            </div>
          )
        })}

        {cropEditing && source && (
          <div
            aria-label="Crop area. Drag to move, drag corners to resize."
            onPointerDown={onCropBoxDown}
            className="absolute cursor-move touch-none ring-2 ring-white"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
              boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.6)",
            }}
          >
            {/* Rule-of-thirds guides. */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <span className="absolute inset-y-0 left-1/3 w-px bg-white/35" />
              <span className="absolute inset-y-0 left-2/3 w-px bg-white/35" />
              <span className="absolute inset-x-0 top-1/3 h-px bg-white/35" />
              <span className="absolute inset-x-0 top-2/3 h-px bg-white/35" />
            </div>
            {CORNERS.map((corner) => (
              <div
                key={corner}
                aria-hidden
                onPointerDown={onCropCornerDown(corner)}
                // Brackets sit inside the box so they never clip at the
                // frame edge; the 44px hit area overhangs where it can.
                className={cn(
                  "absolute size-11 touch-none",
                  corner === "nw" && "-top-2 -left-2 cursor-nwse-resize",
                  corner === "ne" && "-top-2 -right-2 cursor-nesw-resize",
                  corner === "sw" && "-bottom-2 -left-2 cursor-nesw-resize",
                  corner === "se" && "-right-2 -bottom-2 cursor-nwse-resize"
                )}
              >
                <span
                  className={cn(
                    "absolute size-5 border-white drop-shadow-[0_0_2px_rgb(0_0_0/0.8)]",
                    corner === "nw" && "top-2 left-2 border-t-4 border-l-4",
                    corner === "ne" && "top-2 right-2 border-t-4 border-r-4",
                    corner === "sw" && "bottom-2 left-2 border-b-4 border-l-4",
                    corner === "se" && "right-2 bottom-2 border-r-4 border-b-4"
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {audioTracks.map((track) => (
        <audio
          key={track.id}
          ref={setMedia(track.id)}
          src={track.url}
          preload="auto"
          className="hidden"
        />
      ))}

      <EQVisualizer analyser={analyser} show={showLiveEQ && !cropEditing} />

      {speed !== 1 && !cropEditing && (
        <span className="pointer-events-none absolute top-2 left-2 z-20 rounded-full bg-black/60 px-2.5 py-1 font-mono text-xs font-bold text-white tabular-nums">
          {formatSpeed(speed)}
        </span>
      )}
    </div>
  )
}

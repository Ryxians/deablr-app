import type { CropRect, SourceInfo, TimeRange, Track } from "./types"

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Length of the exported video: the trimmed main clip at its new speed. */
export function outputDuration(trim: TimeRange, speed: number) {
  return Math.max(0, trim.end - trim.start) / speed
}

/** Main-video file time → output timeline time. */
export function sourceToOutput(source: number, trim: TimeRange, speed: number) {
  return (source - trim.start) / speed
}

/** Output timeline time → main-video file time. */
export function outputToSource(output: number, trim: TimeRange, speed: number) {
  return trim.start + output * speed
}

export function trackLength(track: Pick<Track, "trim">) {
  return Math.max(0, track.trim.end - track.trim.start)
}

/**
 * Where a track's file should be at a given output time, and whether it is
 * audible/visible then. Outside its span it parks on its nearest edge so a
 * paused preview shows the right frame.
 */
export function trackTimeAt(
  track: Pick<Track, "start" | "trim">,
  output: number
) {
  const local = output - track.start
  const length = trackLength(track)
  const active = local >= 0 && local < length
  return {
    active,
    fileTime: track.trim.start + clamp(local, 0, length),
  }
}

/** m:ss, or h:mm:ss for long clips; `tenths` adds .t for precise readouts. */
export function formatTime(seconds: number, tenths = false) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const whole = tenths ? Math.floor(safe) : Math.round(safe)
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = (whole % 60).toString().padStart(2, "0")
  const base =
    h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`
  if (!tenths) return base
  return `${base}.${Math.floor((safe - whole) * 10)}`
}

export function isFullCrop(crop: CropRect) {
  return (
    crop.x <= 0.0005 && crop.y <= 0.0005 && crop.w >= 0.9995 && crop.h >= 0.9995
  )
}

const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2)

/** The crop in whole source pixels, with even sizes so H.264 accepts it. */
export function cropPixels(
  crop: CropRect,
  source: Pick<SourceInfo, "width" | "height">
) {
  const w = even(crop.w * source.width)
  const h = even(crop.h * source.height)
  const x = clamp(Math.round(crop.x * source.width), 0, source.width - w)
  const y = clamp(Math.round(crop.y * source.height), 0, source.height - h)
  return { x, y, w, h }
}

export type AspectId = "free" | "original" | "16:9" | "9:16" | "1:1" | "4:5"

export const ASPECTS: Array<{ id: AspectId; label: string; ratio?: number }> = [
  { id: "free", label: "Free" },
  { id: "original", label: "Original" },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
]

/** Pixel aspect ratio a preset locks to, or null when free. */
export function aspectRatioFor(
  id: AspectId,
  source: Pick<SourceInfo, "width" | "height">
) {
  if (id === "free") return null
  if (id === "original") return source.width / source.height
  return ASPECTS.find((a) => a.id === id)?.ratio ?? null
}

/** The largest centred crop with the given pixel aspect ratio. */
export function centeredCrop(
  ratio: number,
  source: Pick<SourceInfo, "width" | "height">
): CropRect {
  const sourceRatio = source.width / source.height
  if (ratio >= sourceRatio) {
    const h = sourceRatio / ratio
    return { x: 0, y: (1 - h) / 2, w: 1, h }
  }
  const w = ratio / sourceRatio
  return { x: (1 - w) / 2, y: 0, w, h: 1 }
}

/** Output frame size in pixels (after crop), for laying out layers. */
export function outputFrame(
  crop: CropRect,
  source: Pick<SourceInfo, "width" | "height">
) {
  const px = cropPixels(crop, source)
  return { width: px.w, height: px.h }
}

/** A layer's height as a fraction of the output frame height. */
export function layerHeightFraction(
  layer: { w: number; width: number; height: number },
  frame: { width: number; height: number }
) {
  if (!layer.width || !frame.height) return layer.w
  return (layer.w * frame.width * (layer.height / layer.width)) / frame.height
}

export type Corner = "nw" | "ne" | "sw" | "se"

/**
 * Resize a crop by dragging one corner; the opposite corner stays put.
 * `lock` is the width/height ratio in *fraction* space (pixel ratio ×
 * source height / source width), or null for a free crop.
 */
export function resizeCrop(
  orig: CropRect,
  corner: Corner,
  dx: number,
  dy: number,
  lock: number | null,
  min = 0.05
): CropRect {
  const left = corner === "nw" || corner === "sw"
  const top = corner === "nw" || corner === "ne"
  const anchorX = left ? orig.x + orig.w : orig.x
  const anchorY = top ? orig.y + orig.h : orig.y
  const maxW = left ? anchorX : 1 - anchorX
  const maxH = top ? anchorY : 1 - anchorY

  let w = (left ? -dx : dx) + orig.w
  let h = (top ? -dy : dy) + orig.h
  w = clamp(w, min, maxW)
  h = clamp(h, min, maxH)

  if (lock) {
    // Follow whichever side the pointer pushed further, then fit inside.
    if (w / h > lock) h = w / lock
    else w = h * lock
    if (w > maxW) {
      w = maxW
      h = w / lock
    }
    if (h > maxH) {
      h = maxH
      w = h * lock
    }
  }

  return {
    x: left ? anchorX - w : anchorX,
    y: top ? anchorY - h : anchorY,
    w,
    h,
  }
}

/** Latest a clip may start: just before the video ends. */
export function clampStart(start: number, duration: number) {
  return clamp(start, 0, Math.max(0, duration - 0.05))
}

/** Keep a layer inside the output frame and no bigger than it. */
export function fitLayer<
  T extends { x: number; y: number; w: number; width: number; height: number },
>(layer: T, frame: { width: number; height: number } | null): T {
  if (!frame) return layer
  const heightPerWidth = layerHeightFraction({ ...layer, w: 1 }, frame)
  const w = clamp(layer.w, 0.05, Math.min(1, 1 / heightPerWidth))
  const h = w * heightPerWidth
  return {
    ...layer,
    w,
    x: clamp(layer.x, 0, Math.max(0, 1 - w)),
    y: clamp(layer.y, 0, Math.max(0, 1 - h)),
  }
}

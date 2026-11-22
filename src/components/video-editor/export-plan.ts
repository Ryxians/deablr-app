import {
  cropPixels,
  isFullCrop,
  outputDuration,
  trackLength,
} from "./timeline-math"
import type { VideoEdits } from "./types"

/** What ffmpeg found in each file written to its virtual filesystem. */
export interface ExportInputs {
  main: { name: string; hasAudio: boolean }
  layers: Array<{ name: string; hasAudio: boolean }>
  audioTracks: Array<{ name: string; hasAudio: boolean }>
}

export interface ExportPlan {
  args: Array<string>
  /** Seconds of video the export will produce; drives the progress bar. */
  duration: number
  /** True when every frame is re-encoded, which is much slower. */
  reencode: boolean
}

/** Trims float noise so filter strings stay short and stable. */
const num = (n: number) => String(Number(n.toFixed(4)))

/**
 * atempo has historically been limited to 0.5–2 per instance, so chain
 * factors to reach anything outside that range (e.g. 3× → 2 × 1.5).
 */
export function atempoChain(speed: number) {
  const factors: Array<number> = []
  let remaining = speed
  while (remaining > 2) {
    factors.push(2)
    remaining /= 2
  }
  while (remaining < 0.5) {
    factors.push(0.5)
    remaining /= 0.5
  }
  factors.push(remaining)
  return factors.map((f) => `atempo=${Number(f.toFixed(6))}`).join(",")
}

/** Input options that make ffmpeg read only part of a file. */
function seekArgs(start: number, length: number, fileDuration: number) {
  const args: Array<string> = []
  if (start > 0.001) args.push("-ss", num(start))
  if (start > 0.001 || start + length < fileDuration - 0.001) {
    args.push("-t", num(length))
  }
  return args
}

export function isTrimmed(edits: Pick<VideoEdits, "trim" | "source">) {
  return (
    edits.trim.start > 0.001 || edits.trim.end < edits.source.duration - 0.001
  )
}

/** Whether the export has to re-encode video rather than copy it. */
export function needsVideoReencode(edits: VideoEdits) {
  return (
    isTrimmed(edits) ||
    !isFullCrop(edits.crop) ||
    edits.speed !== 1 ||
    edits.layers.some((l) => l.start < outputDuration(edits.trim, edits.speed))
  )
}

export function buildExportPlan(
  edits: VideoEdits,
  inputs: ExportInputs,
  outputName: string
): ExportPlan {
  const { source, trim, crop, speed } = edits
  const duration = outputDuration(trim, speed)
  const reencode = needsVideoReencode(edits)
  // Layers/tracks that begin after the video ends can't be seen or heard.
  const layers = edits.layers
    .map((layer, i) => ({ layer, input: inputs.layers[i] }))
    .filter(({ layer }) => layer.start < duration && trackLength(layer) > 0)
  const audioTracks = edits.audioTracks
    .map((track, i) => ({ track, input: inputs.audioTracks[i] }))
    .filter(
      ({ track, input }) =>
        input.hasAudio &&
        track.volume > 0 &&
        track.start < duration &&
        trackLength(track) > 0
    )

  const args: Array<string> = []
  // Input 0 is the main video. A trimmed main clip has to be re-encoded
  // anyway, so seeking on input is both fast and frame-accurate.
  if (reencode) {
    args.push(...seekArgs(trim.start, trim.end - trim.start, source.duration))
  }
  args.push("-i", inputs.main.name)
  let inputCount = 1

  // Maps a layer/track (by its index in edits) to its ffmpeg input number.
  const layerIndex = new Map<number, number>()
  for (const { layer, input } of layers) {
    layerIndex.set(edits.layers.indexOf(layer), inputCount++)
    args.push(
      ...seekArgs(layer.trim.start, trackLength(layer), layer.duration),
      "-i",
      input.name
    )
  }
  const audioIndex = new Map<number, number>()
  for (const { track, input } of audioTracks) {
    audioIndex.set(edits.audioTracks.indexOf(track), inputCount++)
    args.push(
      ...seekArgs(track.trim.start, trackLength(track), track.duration),
      "-i",
      input.name
    )
  }

  const filters: Array<string> = []

  // ── Video ────────────────────────────────────────────────────────────
  if (reencode) {
    const px = cropPixels(crop, source)
    const chain = [
      "setpts=PTS-STARTPTS",
      `crop=${px.w}:${px.h}:${px.x}:${px.y}`,
    ]
    if (speed !== 1) chain.push(`setpts=PTS/${num(speed)}`)
    filters.push(`[0:v]${chain.join(",")}[v0]`)

    let current = "v0"
    layers.forEach(({ layer }, i) => {
      const idx = layerIndex.get(edits.layers.indexOf(layer))!
      const end = layer.start + trackLength(layer)
      const width = Math.max(2, Math.round((layer.w * px.w) / 2) * 2)
      const x = Math.round(layer.x * px.w)
      const y = Math.round(layer.y * px.h)
      filters.push(
        `[${idx}:v]setpts=PTS-STARTPTS+${num(layer.start)}/TB,scale=${width}:-2[l${i}]`,
        `[${current}][l${i}]overlay=x=${x}:y=${y}:eof_action=pass:enable='between(t,${num(layer.start)},${num(end)})'[v${i + 1}]`
      )
      current = `v${i + 1}`
    })
    filters.push(`[${current}]format=yuv420p[vout]`)
  }

  // ── Audio ────────────────────────────────────────────────────────────
  const mixInputs: Array<string> = []
  if (inputs.main.hasAudio) {
    const eq = edits.bands
      .filter((band) => band.gain !== 0)
      .map(
        (band) =>
          `equalizer=f=${band.freq}:width_type=q:width=${band.q}:g=${num(band.gain)}`
      )
    const chain = [
      "asetpts=PTS-STARTPTS",
      ...eq,
      ...(edits.volume !== 1 ? [`volume=${num(edits.volume)}`] : []),
      ...(speed !== 1 ? [atempoChain(speed)] : []),
    ]
    filters.push(`[0:a]${chain.join(",")}[a0]`)
    mixInputs.push("[a0]")
  }
  const delayed = (
    idx: number,
    volume: number,
    start: number,
    label: string
  ) => {
    const ms = Math.round(start * 1000)
    filters.push(
      `[${idx}:a]asetpts=PTS-STARTPTS,volume=${num(volume)}${ms > 0 ? `,adelay=${ms}:all=1` : ""}[${label}]`
    )
    mixInputs.push(`[${label}]`)
  }
  layers.forEach(({ layer, input }, i) => {
    if (!layer.includeAudio || !input.hasAudio || layer.volume <= 0) return
    delayed(
      layerIndex.get(edits.layers.indexOf(layer))!,
      layer.volume,
      layer.start,
      `al${i}`
    )
  })
  audioTracks.forEach(({ track }, i) => {
    delayed(
      audioIndex.get(edits.audioTracks.indexOf(track))!,
      track.volume,
      track.start,
      `at${i}`
    )
  })

  let audioOut: string | null = null
  if (mixInputs.length === 1 && inputs.main.hasAudio) {
    audioOut = "[a0]"
  } else if (mixInputs.length > 0) {
    // A silent bed exactly as long as the video pins the mix length, so
    // late or long tracks can't stretch or shorten the export.
    filters.push(`aevalsrc=0:c=stereo:s=48000:d=${num(duration)}[bed]`)
    filters.push(
      `[bed]${mixInputs.join("")}amix=inputs=${mixInputs.length + 1}:duration=first:normalize=0[aout]`
    )
    audioOut = "[aout]"
  }

  if (filters.length > 0) args.push("-filter_complex", filters.join(";"))

  if (reencode) {
    args.push(
      "-map",
      "[vout]",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20"
    )
  } else {
    args.push("-map", "0:v:0", "-c:v", "copy")
  }

  if (audioOut) {
    args.push("-map", audioOut, "-c:a", "aac", "-b:a", "192k")
  } else {
    args.push("-an")
  }

  args.push("-map_metadata", "0", "-movflags", "+faststart", outputName)

  return {
    args,
    duration: reencode ? duration : source.duration,
    reencode,
  }
}

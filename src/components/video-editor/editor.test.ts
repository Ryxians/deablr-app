import { describe, expect, it } from "vitest"
import { buildExportPlan, needsVideoReencode } from "./export-plan"
import {
  centeredCrop,
  clampStart,
  cropPixels,
  fitLayer,
  formatTime,
  outputDuration,
  resizeCrop,
  trackTimeAt,
} from "./timeline-math"
import { DEFAULT_BANDS, FULL_CROP } from "./types"
import type { AudioTrack, VideoEdits, VideoLayer } from "./types"

const file = {} as File
const base: VideoEdits = {
  source: { width: 1920, height: 1080, duration: 20 },
  trim: { start: 0, end: 20 },
  crop: FULL_CROP,
  speed: 1,
  bands: DEFAULT_BANDS,
  volume: 1,
  layers: [],
  audioTracks: [],
}
const layer: VideoLayer = {
  id: "l1",
  kind: "video",
  file,
  url: "",
  name: "pip.mp4",
  duration: 10,
  start: 2,
  trim: { start: 1, end: 5 },
  volume: 0.5,
  width: 1280,
  height: 720,
  x: 0.5,
  y: 0.1,
  w: 0.4,
  includeAudio: true,
}
const music: AudioTrack = {
  id: "a1",
  kind: "audio",
  file,
  url: "",
  name: "song.mp3",
  duration: 60,
  start: 0,
  trim: { start: 10, end: 60 },
  volume: 0.3,
}
const inputs = {
  main: { name: "main.mp4", hasAudio: true },
  layers: [{ name: "layer0.mp4", hasAudio: true }],
  audioTracks: [{ name: "audio0.mp3", hasAudio: true }],
}

const filterOf = (args: Array<string>) =>
  args[args.indexOf("-filter_complex") + 1] ?? ""

describe("timeline math", () => {
  it("derives output length from trim and speed", () => {
    expect(outputDuration({ start: 2, end: 12 }, 2)).toBe(5)
  })

  it("places a track's file time and activity on the output timeline", () => {
    expect(trackTimeAt(layer, 1)).toEqual({ active: false, fileTime: 1 })
    expect(trackTimeAt(layer, 3.5)).toEqual({ active: true, fileTime: 2.5 })
    expect(trackTimeAt(layer, 9)).toEqual({ active: false, fileTime: 5 })
  })

  it("formats times", () => {
    expect(formatTime(75)).toBe("1:15")
    expect(formatTime(75.46, true)).toBe("1:15.4")
    expect(formatTime(3725)).toBe("1:02:05")
  })
})

describe("crop math", () => {
  it("rounds crops to even pixels inside the frame", () => {
    expect(
      cropPixels({ x: 0.1, y: 0.1, w: 0.333, h: 0.5 }, base.source)
    ).toEqual({ x: 192, y: 108, w: 638, h: 540 })
  })

  it("centres an aspect preset at the largest size that fits", () => {
    const square = centeredCrop(1, base.source)
    const px = cropPixels(square, base.source)
    expect(px.w).toBe(1080)
    expect(px.h).toBe(1080)
    expect(square.x).toBeCloseTo((1 - 1080 / 1920) / 2)
  })

  it("resizes from a corner while the opposite corner stays put", () => {
    const next = resizeCrop(
      { x: 0.2, y: 0.2, w: 0.5, h: 0.5 },
      "nw",
      -0.1,
      0.1,
      null
    )
    expect(next.x + next.w).toBeCloseTo(0.7)
    expect(next.y + next.h).toBeCloseTo(0.7)
    expect(next.x).toBeCloseTo(0.1)
    expect(next.y).toBeCloseTo(0.3)
  })

  it("keeps a locked ratio and stays inside the frame", () => {
    const next = resizeCrop(
      { x: 0.5, y: 0.5, w: 0.2, h: 0.2 },
      "se",
      0.9,
      0.1,
      1
    )
    expect(next.w).toBeCloseTo(next.h)
    expect(next.x + next.w).toBeLessThanOrEqual(1)
    expect(next.y + next.h).toBeLessThanOrEqual(1)
  })
})

describe("export plan", () => {
  it("copies video untouched when only audio changes", () => {
    const edits = { ...base, audioTracks: [music] }
    expect(needsVideoReencode(edits)).toBe(false)
    const { args, reencode } = buildExportPlan(edits, inputs, "out.mp4")
    expect(reencode).toBe(false)
    expect(args).toContain("copy")
    expect(filterOf(args)).toContain("amix=inputs=3:duration=first")
    // The music is read from 0:10, and only for as long as the video runs.
    expect(args.join(" ")).toContain("-ss 10 -t 20 -i audio0.mp3")
  })

  it("trims, crops, speeds up and overlays in one pass", () => {
    const edits: VideoEdits = {
      ...base,
      trim: { start: 4, end: 14 },
      crop: { x: 0, y: 0, w: 0.5, h: 0.5 },
      speed: 2,
      layers: [layer],
    }
    const { args, duration, reencode } = buildExportPlan(
      edits,
      inputs,
      "out.mp4"
    )
    expect(reencode).toBe(true)
    expect(duration).toBe(5)
    const joined = args.join(" ")
    expect(joined).toContain("-ss 4 -t 10 -i main.mp4")
    // The layer starts at 2s of a 5s output, so only 3s of it is used.
    expect(joined).toContain("-ss 1 -t 3 -i layer0.mp4")
    const filter = filterOf(args)
    expect(filter).toContain("crop=960:540:0:0")
    expect(filter).toContain("setpts=PTS/2")
    expect(filter).toContain("atempo=2")
    // Layer: 40% of a 960px frame, placed at (480, 54), visible 2s–5s.
    expect(filter).toContain("scale=384:-2")
    expect(filter).toContain("overlay=x=480:y=54")
    expect(filter).toContain("between(t,2,5)")
    expect(filter).toContain("adelay=2000:all=1")
    expect(args).toContain("libx264")
  })

  it("drops tracks that start after the video ends", () => {
    const edits = { ...base, audioTracks: [{ ...music, start: 25 }] }
    const { args } = buildExportPlan(edits, inputs, "out.mp4")
    expect(args).not.toContain("audio0.mp3")
    expect(filterOf(args)).not.toContain("amix")
  })

  it("handles a silent main video with music", () => {
    const { args } = buildExportPlan(
      { ...base, audioTracks: [music] },
      { ...inputs, main: { name: "main.mp4", hasAudio: false } },
      "out.mp4"
    )
    expect(filterOf(args)).not.toContain("[0:a]")
    expect(filterOf(args)).toContain("amix=inputs=2")
  })

  it("leaves audio out when nothing has sound", () => {
    const { args } = buildExportPlan(
      base,
      { ...inputs, main: { name: "main.mp4", hasAudio: false } },
      "out.mp4"
    )
    expect(args).toContain("-an")
  })
})

describe("review fixes", () => {
  it("cuts a long layer off where the video ends", () => {
    const longLayer = {
      ...layer,
      start: 2,
      trim: { start: 0, end: 10 },
      duration: 30,
    }
    const { args } = buildExportPlan(
      { ...base, trim: { start: 0, end: 5 }, layers: [longLayer] },
      inputs,
      "out.mp4"
    )
    // 5s video, layer from 2s → only 3s of it is read and shown.
    expect(args.join(" ")).toContain("-t 3 -i layer0.mp4")
    expect(filterOf(args)).toContain("between(t,2,5)")
    expect(args.slice(-3)).toEqual(["-t", "5", "out.mp4"])
  })

  it("scales to the displayed size before cropping", () => {
    const { args } = buildExportPlan({ ...base, speed: 2 }, inputs, "out.mp4")
    expect(filterOf(args)).toContain(
      "scale=1920:1080,setsar=1,crop=1920:1080:0:0"
    )
  })

  it("clamps clip starts to just before the end", () => {
    expect(clampStart(-1, 10)).toBe(0)
    expect(clampStart(12, 10)).toBe(9.95)
  })

  it("fits a layer back inside the frame", () => {
    const frame = { width: 1920, height: 1080 }
    const fitted = fitLayer({ ...layer, x: 0.9, y: -0.2, w: 0.4 }, frame)
    expect(fitted.x).toBeCloseTo(0.6)
    expect(fitted.y).toBe(0)
    // A layer can't be wider than the frame allows for its height.
    const tall = fitLayer({ ...layer, width: 720, height: 1280, w: 1 }, frame)
    expect(tall.w * frame.width * (1280 / 720)).toBeLessThanOrEqual(
      frame.height + 0.001
    )
  })
})

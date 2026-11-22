export interface EQBand {
  id: string
  freq: number
  gain: number
  q: number
}

export const DEFAULT_BANDS: Array<EQBand> = [
  { id: "50", freq: 50, gain: 0, q: 0.8 },
  { id: "90", freq: 90, gain: 0, q: 0.8 },
  { id: "350", freq: 350, gain: 0, q: 0.8 },
  { id: "500", freq: 500, gain: 0, q: 0.8 },
  { id: "2000", freq: 2000, gain: 0, q: 0.8 },
  { id: "7000", freq: 7000, gain: 0, q: 0.8 },
]

export const DEFAULT_VOLUME = 1

export const MIN_SPEED = 0.5
export const MAX_SPEED = 3
export const DEFAULT_SPEED = 1
export const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const

/** A span of a media file, in that file's own seconds. */
export interface TimeRange {
  start: number
  end: number
}

/** A crop rectangle as fractions (0–1) of the source frame. */
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 }

/** What the browser reports about the main video once metadata loads. */
export interface SourceInfo {
  width: number
  height: number
  duration: number
}

interface TrackBase {
  id: string
  file: File
  url: string
  name: string
  /** Length of the whole file in seconds. */
  duration: number
  /** Where the track begins on the output timeline, in seconds. */
  start: number
  /** Which part of the file plays. */
  trim: TimeRange
  /** 0–1. */
  volume: number
}

/** A video placed on top of the main video, picture-in-picture style. */
export interface VideoLayer extends TrackBase {
  kind: "video"
  width: number
  height: number
  /** Left edge, top edge and width as fractions of the output frame. */
  x: number
  y: number
  w: number
  includeAudio: boolean
}

/** Extra audio (music, voiceover) mixed under the main video. */
export interface AudioTrack extends TrackBase {
  kind: "audio"
}

export type Track = VideoLayer | AudioTrack

/** Every edit the export bakes into the output file. */
export interface VideoEdits {
  source: SourceInfo
  trim: TimeRange
  crop: CropRect
  speed: number
  bands: Array<EQBand>
  volume: number
  /** Bottom-most first; later layers draw on top. */
  layers: Array<VideoLayer>
  audioTracks: Array<AudioTrack>
}

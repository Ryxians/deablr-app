import { useSyncExternalStore } from "react"
import { clamp, outputDuration, outputToSource } from "./timeline-math"
import type { TimeRange } from "./types"

/**
 * The preview's clock. The main <video> is the source of truth; this
 * mirrors its position on the *output* timeline (after trim and speed) so
 * the transport bar and timeline can follow along at 60fps without
 * re-rendering the whole editor.
 */
export class PlayerStore {
  time = 0
  playing = false
  video: HTMLVideoElement | null = null
  trim: TimeRange = { start: 0, end: 0 }
  speed = 1
  /** Called inside the user's play gesture (resume audio, unlock media). */
  onUserPlay: (() => void) | null = null
  private listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getTime = () => this.time
  getPlaying = () => this.playing

  get duration() {
    return outputDuration(this.trim, this.speed)
  }

  update(time: number, playing: boolean) {
    if (time === this.time && playing === this.playing) return
    this.time = time
    this.playing = playing
    this.listeners.forEach((l) => l())
  }

  /** Jump to a point on the output timeline. */
  seek = (output: number) => {
    const video = this.video
    if (!video) return
    const time = clamp(output, 0, this.duration)
    video.currentTime = outputToSource(time, this.trim, this.speed)
    this.update(time, !video.paused)
  }

  /** Show a specific frame of the main file (e.g. while dragging a trim). */
  previewSourceTime = (source: number) => {
    const video = this.video
    if (!video) return
    if (!video.paused) video.pause()
    video.currentTime = source
  }

  play = () => {
    const video = this.video
    if (!video) return
    const { start, end } = this.trim
    if (video.currentTime >= end - 0.05 || video.currentTime < start) {
      video.currentTime = start
    }
    void video.play().catch(() => {})
    // After play(): `paused` is already false, so layers start in-gesture.
    this.onUserPlay?.()
  }

  pause = () => {
    this.video?.pause()
  }

  toggle = () => {
    if (!this.video) return
    if (this.video.paused) this.play()
    else this.pause()
  }
}

export function usePlayerTime(store: PlayerStore) {
  return useSyncExternalStore(store.subscribe, store.getTime, () => 0)
}

export function usePlayerPlaying(store: PlayerStore) {
  return useSyncExternalStore(store.subscribe, store.getPlaying, () => false)
}

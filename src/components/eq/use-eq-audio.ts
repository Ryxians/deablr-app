import { useCallback, useEffect, useRef } from "react"
import type { EQBand } from "./types"

export function useEQAudio(
  videoElement: HTMLVideoElement | null,
  bands: Array<EQBand>,
  volume: number,
  compare: boolean,
  muted: boolean,
) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const filtersRef = useRef<Array<BiquadFilterNode>>([])
  const gainNodeRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const initialBandsRef = useRef(bands)

  useEffect(() => {
    if (!videoElement) return

    const Ctx = window.AudioContext
    const ctx = new Ctx()
    audioContextRef.current = ctx

    const source = ctx.createMediaElementSource(videoElement)
    const gainNode = ctx.createGain()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256

    const filters = initialBandsRef.current.map((band) => {
      const f = ctx.createBiquadFilter()
      f.type = "peaking"
      f.frequency.value = band.freq
      f.Q.value = band.q
      f.gain.value = band.gain
      return f
    })
    filtersRef.current = filters

    let lastNode: AudioNode = source
    filters.forEach((filter) => {
      lastNode.connect(filter)
      lastNode = filter
    })
    lastNode.connect(gainNode)
    gainNode.connect(analyser)
    analyser.connect(ctx.destination)

    gainNodeRef.current = gainNode
    analyserRef.current = analyser

    return () => {
      void ctx.close()
      audioContextRef.current = null
      filtersRef.current = []
      gainNodeRef.current = null
      analyserRef.current = null
    }
  }, [videoElement])

  useEffect(() => {
    const ctx = audioContextRef.current
    const now = ctx?.currentTime ?? 0
    filtersRef.current.forEach((filter, index) => {
      const targetGain = compare ? 0 : (bands[index]?.gain ?? 0)
      filter.gain.setTargetAtTime(targetGain, now, 0.01)
    })
  }, [bands, compare])

  useEffect(() => {
    const gainNode = gainNodeRef.current
    const ctx = audioContextRef.current
    if (gainNode && ctx) {
      const targetGain = muted ? 0 : volume
      gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.01)
    }
  }, [volume, muted])

  const resumeContext = useCallback(() => {
    const ctx = audioContextRef.current
    if (ctx && ctx.state === "suspended") {
      void ctx.resume()
    }
  }, [])

  return { analyserRef, resumeContext }
}

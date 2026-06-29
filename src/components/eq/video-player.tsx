import { Pause, Play, Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { EQVisualizer } from "./eq-visualizer"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  src: string
  analyser: AnalyserNode | null
  showLiveEQ: boolean
  muted: boolean
  onMutedChange: (muted: boolean) => void
  onPlay: () => void
  onVideoElement: (element: HTMLVideoElement | null) => void
}

export function VideoPlayer({
  src,
  analyser,
  showLiveEQ,
  muted,
  onMutedChange,
  onPlay,
  onVideoElement,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    onVideoElement(video)

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      onVideoElement(null)
    }
  }, [src, onVideoElement])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play().then(() => onPlay())
    } else {
      video.pause()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border bg-black">
      <video
        ref={videoRef}
        src={src}
        className="block aspect-video w-full"
        playsInline
        preload="metadata"
        muted={muted}
        onClick={togglePlay}
      />
      <EQVisualizer analyser={analyser} show={showLiveEQ} />

      {!isPlaying && (
        <button
          type="button"
          aria-label="Play"
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
            <Play className="size-8 fill-current" />
          </div>
        </button>
      )}

      <div className="absolute right-2 top-2 z-20 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="bg-black/60 text-white hover:bg-black/80"
          onClick={() => onMutedChange(!muted)}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center gap-3 text-xs text-white">
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 fill-current" />
            )}
          </button>
          <span className="tabular-nums">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const video = videoRef.current
              if (video) {
                video.currentTime = Number.parseFloat(e.target.value)
              }
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/30 accent-primary"
          />
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

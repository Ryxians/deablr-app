import { useCallback, useEffect, useRef, useState } from "react"
import {
  Activity,
  ArrowLeft,
  Download,
  Loader2,
  Share,
  SlidersHorizontal,
  Upload,
} from "lucide-react"
import { Link } from "@tanstack/react-router"
import { DEFAULT_BANDS, DEFAULT_VOLUME } from "./types"
import { EQControls } from "./eq-controls"
import { useEQAudio } from "./use-eq-audio"
import { useFFmpeg } from "./use-ffmpeg"
import { VideoPlayer } from "./video-player"
import type { EQBand } from "./types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

type ShareResult = "shared" | "unsupported" | "failed"

async function tryShareFile(file: File): Promise<ShareResult> {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function" ||
    !navigator.canShare({ files: [file] })
  ) {
    return "unsupported"
  }
  try {
    await navigator.share({ files: [file] })
    return "shared"
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "shared"
    }
    if (error instanceof TypeError) {
      return "unsupported"
    }
    return "failed"
  }
}

export function EQApp() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoUrlRef = useRef<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [bands, setBands] = useState<Array<EQBand>>(DEFAULT_BANDS)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [compare, setCompare] = useState(false)
  const [showLiveEQ, setShowLiveEQ] = useState(false)
  const [muted, setMuted] = useState(false)
  const [exportedFile, setExportedFile] = useState<File | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const { analyserRef, resumeContext } = useEQAudio(
    videoElement,
    bands,
    volume,
    compare,
    muted,
  )

  const { loaded, loading, progress, exporting, error, processVideo } = useFFmpeg()

  const updateVideoUrl = useCallback((file: File | null) => {
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current)
    }
    videoUrlRef.current = file ? URL.createObjectURL(file) : null
    setVideoUrl(videoUrlRef.current)
  }, [])

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current)
        videoUrlRef.current = null
      }
    }
  }, [])

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      setVideoFile(file)
      setExportedFile(null)
      setShareDialogOpen(false)
      updateVideoUrl(file)
    },
    [updateVideoUrl],
  )

  const handleExport = useCallback(async () => {
    if (!videoFile || exporting || loading) return
    setExportedFile(null)
    setShareDialogOpen(false)

    try {
      const outputFile = await processVideo(videoFile, bands, volume)
      setExportedFile(outputFile)

      const result = await tryShareFile(outputFile)
      if (result !== "shared") {
        setShareDialogOpen(true)
      }
    } catch {
      // Error state is already set by processVideo; no need to rethrow.
    }
  }, [videoFile, bands, volume, exporting, loading, processVideo])

  const handleDialogShare = useCallback(() => {
    if (!exportedFile) return

    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function" ||
      typeof navigator.canShare !== "function" ||
      !navigator.canShare({ files: [exportedFile] })
    ) {
      downloadFile(exportedFile)
      setShareDialogOpen(false)
      return
    }

    navigator
      .share({ files: [exportedFile] })
      .then(() => setShareDialogOpen(false))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          setShareDialogOpen(false)
          return
        }
        // If the share sheet still won't open, fall back to downloading.
        downloadFile(exportedFile)
        setShareDialogOpen(false)
      })
  }, [exportedFile])

  const handleDialogDownload = useCallback(() => {
    if (!exportedFile) return
    downloadFile(exportedFile)
    setShareDialogOpen(false)
  }, [exportedFile])

  const handleReset = useCallback(() => {
    setBands(DEFAULT_BANDS)
    setVolume(DEFAULT_VOLUME)
  }, [])

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex items-center justify-between gap-2">
        <Link to="/projects">
          <Button type="button" variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = ""
              fileInputRef.current?.click()
            }}
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!videoFile || exporting || loading}
            onClick={handleExport}
          >
            {exporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="hidden sm:inline">{progress}%</span>
              </>
            ) : loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </>
            ) : (
              <>
                <Download className="size-4" />
                <span className="hidden sm:inline">Export</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {!videoUrl ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="rounded-full bg-muted p-4">
              <SlidersHorizontal className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="font-semibold text-lg">Upload a video to get started</h2>
              <p className="text-muted-foreground text-sm">
                EQ changes happen live in the browser. Export with ffmpeg.wasm.
              </p>
            </div>
            <Button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = ""
                fileInputRef.current?.click()
              }}
            >
              <Upload className="size-4" />
              Choose video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <VideoPlayer
            src={videoUrl}
            analyser={analyserRef.current}
            showLiveEQ={showLiveEQ}
            muted={muted}
            onMutedChange={setMuted}
            onPlay={resumeContext}
            onVideoElement={setVideoElement}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={showLiveEQ ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLiveEQ((s) => !s)}
              >
                <Activity className="size-4" />
                Live EQ
              </Button>
              <Button
                type="button"
                variant={compare ? "default" : "outline"}
                size="sm"
                className="touch-none select-none"
                onMouseDown={() => setCompare(true)}
                onMouseUp={() => setCompare(false)}
                onMouseLeave={() => setCompare(false)}
                onTouchStart={(e) => {
                  e.preventDefault()
                  setCompare(true)
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  setCompare(false)
                }}
              >
                Compare
              </Button>
            </div>
            <div className="text-muted-foreground text-xs">
              {compare
                ? "Bypassing EQ"
                : exporting
                  ? `Processing... ${progress}%`
                  : loading
                    ? "Loading ffmpeg.wasm..."
                    : loaded
                      ? "ffmpeg.wasm ready"
                      : "Press Export to process"}
            </div>
          </div>

          <EQControls bands={bands} onChange={setBands} onReset={handleReset} />

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium whitespace-nowrap">Volume</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
                onTouchStart={(e) => e.preventDefault()}
                onTouchMove={(e) => e.preventDefault()}
                className="h-2 flex-1 cursor-pointer appearance-none rounded bg-border accent-primary"
                style={{ touchAction: "none" }}
              />
              <span className="w-12 text-right text-xs tabular-nums">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {shareDialogOpen && exportedFile && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-title"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShareDialogOpen(false)
              }}
            >
              <Card className="w-full max-w-sm">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="text-center">
                    <h3
                      id="share-title"
                      className="font-semibold text-lg"
                    >
                      Export ready
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Your EQ&apos;d video is ready to share.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      onClick={handleDialogShare}
                    >
                      <Share className="size-4" />
                      Share
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDialogDownload}
                    >
                      <Download className="size-4" />
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShareDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

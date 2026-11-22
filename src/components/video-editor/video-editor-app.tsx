import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, Loader2, Upload, X } from "lucide-react"
import {
  DEFAULT_BANDS,
  DEFAULT_SPEED,
  DEFAULT_VOLUME,
  FULL_CROP,
} from "./types"
import { EditorTools } from "./editor-tools"
import { ExportDialog, tryShareFile } from "./export-dialog"
import { needsVideoReencode } from "./export-plan"
import { loadMediaInfo } from "./load-media"
import { PlayerStore } from "./player-store"
import { Stage } from "./stage"
import {
  aspectRatioFor,
  centeredCrop,
  clampStart,
  fitLayer,
  outputDuration,
  outputFrame,
} from "./timeline-math"
import { Timeline } from "./timeline"
import { TrackInspector } from "./track-inspector"
import { Transport } from "./transport"
import { ExportCancelledError, useFFmpeg } from "./use-ffmpeg"
import { useEQAudio } from "./use-eq-audio"
import type { ToolTab } from "./editor-tools"
import type { AspectId } from "./timeline-math"
import type {
  AudioTrack,
  CropRect,
  EQBand,
  SourceInfo,
  TimeRange,
  Track,
  VideoEdits,
  VideoLayer,
} from "./types"
import { Button, buttonVariants } from "@/components/ui/button"

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function VideoEditorApp() {
  const mainInputRef = useRef<HTMLInputElement | null>(null)
  const layerInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  /** Every object URL we've made, so they can all be freed on unmount. */
  const urlsRef = useRef(new Set<string>())
  const [store] = useState(() => new PlayerStore())

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  )
  const [source, setSource] = useState<SourceInfo | null>(null)

  const [trimOverride, setTrimOverride] = useState<TimeRange | null>(null)
  const [crop, setCrop] = useState<CropRect>(FULL_CROP)
  const [aspect, setAspect] = useState<AspectId>("free")
  const [speed, setSpeed] = useState(DEFAULT_SPEED)
  const [bands, setBands] = useState<Array<EQBand>>(DEFAULT_BANDS)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [layers, setLayers] = useState<Array<VideoLayer>>([])
  const [audioTracks, setAudioTracks] = useState<Array<AudioTrack>>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<ToolTab>("trim")
  const [compare, setCompare] = useState(false)
  const [showLiveEQ, setShowLiveEQ] = useState(false)
  const [muted, setMuted] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [exportedFile, setExportedFile] = useState<File | null>(null)

  const { analyserRef, resumeContext } = useEQAudio(
    videoElement,
    bands,
    volume,
    compare,
    muted
  )
  const { loading, progress, exporting, error, processVideo, cancel } =
    useFFmpeg()

  // Until the user trims, the whole clip is kept.
  const trim = useMemo<TimeRange>(
    () => trimOverride ?? { start: 0, end: source?.duration ?? 0 },
    [trimOverride, source?.duration]
  )
  const duration = outputDuration(trim, speed)
  const frame = useMemo(
    () => (source ? outputFrame(crop, source) : null),
    [crop, source]
  )
  // Layers are stored as placed; a tighter crop can squeeze them back in.
  const fittedLayers = useMemo(
    () => layers.map((layer) => fitLayer(layer, frame)),
    [layers, frame]
  )
  const selectedTrack: Track | undefined =
    fittedLayers.find((l) => l.id === selectedId) ??
    audioTracks.find((t) => t.id === selectedId)
  const cropEditing = tab === "crop" && !selectedTrack && !!source

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const pickFile = (input: HTMLInputElement | null) => {
    if (!input) return
    input.value = ""
    input.click()
  }

  const handleMainFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      urlsRef.current.delete(videoUrl)
    }
    const url = URL.createObjectURL(file)
    urlsRef.current.add(url)
    setVideoFile(file)
    setVideoUrl(url)
    // Trim and crop are tied to the old clip's length and frame.
    setSource(null)
    setTrimOverride(null)
    setCrop(FULL_CROP)
    setAspect("free")
    setExportedFile(null)
    setSelectedId(null)
  }

  const handleSourceInfo = useCallback((info: SourceInfo) => {
    setSource((prev) =>
      prev &&
      prev.width === info.width &&
      prev.height === info.height &&
      prev.duration === info.duration
        ? prev
        : info
    )
  }, [])

  const startForNewTrack = () => clampStart(store.time, duration)

  const handleAddFiles = async (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "video" | "audio"
  ) => {
    const files = Array.from(event.target.files ?? [])
    setNotice(null)
    for (const file of files) {
      try {
        const info = await loadMediaInfo(file, kind)
        urlsRef.current.add(info.url)
        const base = {
          id: newId(),
          file,
          url: info.url,
          name: file.name,
          duration: info.duration,
          start: startForNewTrack(),
          trim: { start: 0, end: info.duration },
          volume: 1,
        }
        if (kind === "video") {
          // Picture-in-picture in the top-right corner by default.
          const w = 0.35
          setLayers((prev) => [
            ...prev,
            {
              ...base,
              kind: "video",
              width: info.width,
              height: info.height,
              w,
              x: 1 - w - 0.04,
              y: 0.04,
              includeAudio: true,
            },
          ])
        } else {
          setAudioTracks((prev) => [...prev, { ...base, kind: "audio" }])
        }
        setSelectedId(base.id)
      } catch (err) {
        setNotice(
          err instanceof Error ? err.message : "Couldn't add that file."
        )
      }
    }
  }

  /** Layers are also kept inside the output frame as they're moved. */
  const updateTrack = useCallback(
    (id: string, patch: Partial<Track>) => {
      setLayers((prev) =>
        prev.map((l) =>
          l.id === id ? fitLayer({ ...l, ...patch } as VideoLayer, frame) : l
        )
      )
      setAudioTracks((prev) =>
        prev.map((t) => (t.id === id ? ({ ...t, ...patch } as AudioTrack) : t))
      )
    },
    [frame]
  )

  const removeTrack = (id: string) => {
    const track =
      layers.find((l) => l.id === id) ?? audioTracks.find((t) => t.id === id)
    if (track) {
      URL.revokeObjectURL(track.url)
      urlsRef.current.delete(track.url)
    }
    setLayers((prev) => prev.filter((l) => l.id !== id))
    setAudioTracks((prev) => prev.filter((t) => t.id !== id))
    setSelectedId(null)
  }

  const moveLayer = (id: string, direction: -1 | 1) => {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id)
      const j = i + direction
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const handleAspectChange = (id: AspectId) => {
    setAspect(id)
    const ratio = source ? aspectRatioFor(id, source) : null
    if (ratio && source) setCrop(centeredCrop(ratio, source))
  }

  const edits: VideoEdits | null = source
    ? {
        source,
        trim,
        crop,
        speed,
        bands,
        volume,
        layers: fittedLayers,
        audioTracks,
      }
    : null
  const reencode = edits ? needsVideoReencode(edits) : false

  const handleExport = async () => {
    if (!videoFile || !edits || exporting) return
    store.pause()
    setExportedFile(null)
    try {
      const output = await processVideo(videoFile, edits)
      const result = await tryShareFile(output)
      if (result !== "shared") setExportedFile(output)
    } catch (err) {
      if (err instanceof ExportCancelledError) return
      // Other errors are already surfaced by useFFmpeg.
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={mainInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleMainFile}
      />
      <input
        ref={layerInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => void handleAddFiles(e, "video")}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => void handleAddFiles(e, "audio")}
      />

      {!videoUrl ? (
        <button
          type="button"
          onClick={() => pickFile(mainInputRef.current)}
          className="group flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card/60 px-6 py-16 text-center transition-colors outline-none hover:border-primary/70 hover:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50 md:py-20"
        >
          <span>
            <span className="block font-mono text-lg font-bold">
              Pick a video
            </span>
            <span className="mt-1 block text-[15px] text-muted-foreground">
              Trim, crop, change speed, add layers and music. Nothing leaves
              your device.
            </span>
          </span>
          <span className={buttonVariants({ className: "mt-1" })}>
            <Upload />
            Browse files
          </span>
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">
              {frame ? `${frame.width}×${frame.height}` : "Loading…"}
              {reencode && " · re-encodes on export"}
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => pickFile(mainInputRef.current)}
              >
                <Upload />
                <span className="hidden sm:inline">Replace video</span>
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!edits || exporting}
                onClick={() => void handleExport()}
              >
                {exporting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
                Export
              </Button>
            </div>
          </div>

          {exporting && (
            <div
              role="status"
              className="space-y-2 rounded-xl border border-primary/40 bg-card p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums">
                  {loading ? "Loading ffmpeg.wasm…" : `Exporting… ${progress}%`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancel}
                >
                  <X />
                  Cancel
                </Button>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${loading ? 0 : progress}%` }}
                />
              </div>
              {reencode && (
                <p className="text-sm text-muted-foreground">
                  Every frame is re-encoded in your browser, so long clips take
                  a while. Keep this tab open.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Stage
              store={store}
              src={videoUrl}
              source={source}
              onSourceInfo={handleSourceInfo}
              onVideoElement={setVideoElement}
              onUserPlay={resumeContext}
              trim={trim}
              speed={speed}
              crop={crop}
              cropEditing={cropEditing}
              cropRatio={source ? aspectRatioFor(aspect, source) : null}
              onCropChange={setCrop}
              layers={fittedLayers}
              audioTracks={audioTracks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onLayerChange={updateTrack}
              muted={muted}
              analyser={analyserRef.current}
              showLiveEQ={showLiveEQ}
            />
            <Transport
              store={store}
              duration={duration}
              muted={muted}
              onMutedChange={setMuted}
            />
          </div>

          <Timeline
            store={store}
            duration={duration}
            mainName={videoFile?.name ?? "Main video"}
            layers={fittedLayers}
            audioTracks={audioTracks}
            selectedId={selectedTrack ? selectedTrack.id : null}
            onSelect={setSelectedId}
            onStartChange={(id, start) => updateTrack(id, { start })}
            onAddLayer={() => pickFile(layerInputRef.current)}
            onAddAudio={() => pickFile(audioInputRef.current)}
          />

          {notice && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {notice}
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setNotice(null)}
                className="-m-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-md md:size-8"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {selectedTrack ? (
            <TrackInspector
              key={selectedTrack.id}
              track={selectedTrack}
              store={store}
              duration={duration}
              layerIndex={fittedLayers.findIndex(
                (l) => l.id === selectedTrack.id
              )}
              layerCount={fittedLayers.length}
              onChange={(patch) => updateTrack(selectedTrack.id, patch)}
              onMoveLayer={(dir) => moveLayer(selectedTrack.id, dir)}
              onRemove={() => removeTrack(selectedTrack.id)}
              onDone={() => setSelectedId(null)}
            />
          ) : (
            source && (
              <EditorTools
                tab={tab}
                onTabChange={setTab}
                store={store}
                source={source}
                trim={trim}
                onTrimChange={setTrimOverride}
                crop={crop}
                aspect={aspect}
                onAspectChange={handleAspectChange}
                onCropReset={() => {
                  setAspect("free")
                  setCrop(FULL_CROP)
                }}
                speed={speed}
                onSpeedChange={setSpeed}
                bands={bands}
                onBandsChange={setBands}
                volume={volume}
                onVolumeChange={setVolume}
                onSoundReset={() => {
                  setBands(DEFAULT_BANDS)
                  setVolume(DEFAULT_VOLUME)
                }}
                showLiveEQ={showLiveEQ}
                onShowLiveEQChange={setShowLiveEQ}
                compare={compare}
                onCompareChange={setCompare}
              />
            )
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {exportedFile && (
            <ExportDialog
              file={exportedFile}
              onClose={() => setExportedFile(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

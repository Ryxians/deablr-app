import { useCallback, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"
import type { VideoEdits } from "./types"

const LOAD_TIMEOUT_MS = 120_000
const REMUX_TIMEOUT_MS = 10 * 60 * 1000
/** Speed changes re-encode every frame in wasm, which is far slower. */
const REENCODE_TIMEOUT_MS = 30 * 60 * 1000

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

function getOutputName(filename: string) {
  const dot = filename.lastIndexOf(".")
  const base = (dot > 0 ? filename.slice(0, dot) : filename) || "video"
  return `${base}-edited.mp4`
}

function getExtension(filename: string) {
  const ext = filename.slice(filename.lastIndexOf("."))
  return ext.includes(".") ? ext : ".mp4"
}

function getVideoMimeType(filename: string) {
  const ext = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase()
  const map: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    qt: "video/quicktime",
    webm: "video/webm",
    ogv: "video/ogg",
    mkv: "video/x-matroska",
  }
  return map[ext] ?? "video/mp4"
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const loadPromiseRef = useRef<Promise<void> | null>(null)
  const processingRef = useRef(false)
  /** ffmpeg reports progress against output time, which speed rescales. */
  const speedRef = useRef(1)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getFFmpeg = useCallback(() => {
    if (typeof window === "undefined") {
      throw new Error("ffmpeg.wasm can only be used in the browser")
    }
    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg()
      ffmpeg.on("log", ({ message }) => {
        console.log(message)
      })
      ffmpeg.on("progress", ({ progress: value }) => {
        const scaled = value * speedRef.current
        setProgress(Math.round(Math.min(1, Math.max(0, scaled)) * 100))
      })
      ffmpegRef.current = ffmpeg
    }
    return ffmpegRef.current
  }, [])

  const resetFFmpeg = useCallback(() => {
    try {
      ffmpegRef.current?.terminate()
    } catch {
      // ignore cleanup errors
    }
    ffmpegRef.current = null
    loadPromiseRef.current = null
    setLoaded(false)
    setLoading(false)
    setExporting(false)
    processingRef.current = false
  }, [])

  const load = useCallback(async () => {
    if (loaded) return
    if (loadPromiseRef.current) {
      await loadPromiseRef.current
      return
    }

    setLoading(true)
    setError(null)

    loadPromiseRef.current = (async () => {
      try {
        const ffmpeg = getFFmpeg()
        const base = import.meta.env.BASE_URL.replace(/\/$/, "")
        const coreURL = `${base}/ffmpeg/ffmpeg-core.js`
        const wasmURL = `${base}/ffmpeg/ffmpeg-core.wasm`
        const controller = new AbortController()
        const timeoutId = setTimeout(
          () =>
            controller.abort(
              new DOMException("Loading ffmpeg.wasm timed out", "TimeoutError")
            ),
          LOAD_TIMEOUT_MS
        )
        try {
          await ffmpeg.load(
            {
              coreURL,
              wasmURL,
            },
            { signal: controller.signal }
          )
        } finally {
          clearTimeout(timeoutId)
        }
        setLoaded(true)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load ffmpeg.wasm"
        const timedOut = /abort|timeout/i.test(message)
        if (timedOut) {
          resetFFmpeg()
        }
        const userMessage = timedOut
          ? "Loading ffmpeg.wasm timed out. Please try again."
          : message
        setError(userMessage)
        console.error("ffmpeg.wasm load error:", err)
        throw err
      } finally {
        setLoading(false)
        loadPromiseRef.current = null
      }
    })()

    await loadPromiseRef.current
  }, [loaded, getFFmpeg, resetFFmpeg])

  const processVideo = useCallback(
    async (file: File, { bands, volume, speed }: VideoEdits) => {
      if (processingRef.current) {
        throw new Error("An export is already in progress")
      }
      processingRef.current = true

      try {
        await load()
        setExporting(true)
        speedRef.current = speed
        setProgress(0)
        setError(null)

        const ffmpeg = getFFmpeg()

        const inputName = `input${getExtension(file.name)}`
        const outputName = "output.mp4"
        const changeSpeed = speed !== 1

        await ffmpeg.writeFile(inputName, await fetchFile(file))

        const eqFilters = bands
          .map(
            (band) =>
              `equalizer=f=${band.freq}:width_type=q:width=${band.q}:g=${band.gain}`
          )
          .join(",")
        const volumeFilter = volume !== 1 ? `volume=${volume}` : ""
        const tempoFilter = changeSpeed ? atempoChain(speed) : ""
        const audioFilter = [eqFilters, volumeFilter, tempoFilter]
          .filter(Boolean)
          .join(",")

        // Without a speed change the video stream is copied untouched; with
        // one, every frame gets new timestamps so it must be re-encoded.
        const videoArgs = changeSpeed
          ? [
              "-filter:v",
              `setpts=PTS/${speed}`,
              "-c:v",
              "libx264",
              "-preset",
              "veryfast",
              "-crf",
              "20",
              "-pix_fmt",
              "yuv420p",
            ]
          : ["-c:v", "copy"]

        const args = [
          "-i",
          inputName,
          ...(audioFilter ? ["-af", audioFilter] : []),
          ...videoArgs,
          "-map_metadata",
          "0",
          "-map_metadata:s:v",
          "0:s:v",
          "-map_metadata:s:a",
          "0:s:a",
          "-movflags",
          "+faststart",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          outputName,
        ]

        await withTimeout(
          ffmpeg.exec(args),
          changeSpeed ? REENCODE_TIMEOUT_MS : REMUX_TIMEOUT_MS,
          "Export took too long and was stopped."
        )

        const data = await ffmpeg.readFile(outputName)

        try {
          await ffmpeg.deleteFile(inputName)
          await ffmpeg.deleteFile(outputName)
        } catch {
          // Ignore cleanup errors so they don't mask the successful export.
        }

        const blob = new Blob([data as BlobPart], {
          type: getVideoMimeType(outputName),
        })
        return new File([blob], getOutputName(file.name), {
          type: getVideoMimeType(outputName),
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed"
        if (/too long/i.test(message)) {
          resetFFmpeg()
        }
        setError(message)
        console.error("ffmpeg export error:", err)
        throw err
      } finally {
        setExporting(false)
        processingRef.current = false
      }
    },
    [load, getFFmpeg, resetFFmpeg]
  )

  return { loaded, loading, progress, exporting, error, load, processVideo }
}

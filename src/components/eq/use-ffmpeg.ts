import { useCallback, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"
import type { EQBand } from "./types"

const LOAD_TIMEOUT_MS = 120_000

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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
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
        setProgress(Math.round(value * 100))
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
        const [{ default: coreURL }, { default: wasmURL }] = await Promise.all([
          import("../../../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js?url"),
          import("../../../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm?url"),
        ])
        const controller = new AbortController()
        const timeoutId = setTimeout(
          () => controller.abort(new DOMException("Loading ffmpeg.wasm timed out", "TimeoutError")),
          LOAD_TIMEOUT_MS,
        )
        try {
          await ffmpeg.load(
            {
              coreURL,
              wasmURL,
            },
            { signal: controller.signal },
          )
        } finally {
          clearTimeout(timeoutId)
        }
        setLoaded(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load ffmpeg.wasm"
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
    async (file: File, bands: Array<EQBand>, volume: number) => {
      if (processingRef.current) {
        throw new Error("An export is already in progress")
      }
      processingRef.current = true

      try {
        await load()
        setExporting(true)
        setProgress(0)
        setError(null)

        const ffmpeg = getFFmpeg()

        const inputName = `input${getExtension(file.name)}`
        const outputName = "output.mp4"

        await ffmpeg.writeFile(inputName, await fetchFile(file))

        const eqFilters = bands
          .map(
            (band) =>
              `equalizer=f=${band.freq}:width_type=q:width=${band.q}:g=${band.gain}`,
          )
          .join(",")
        const volumeFilter = volume !== 1 ? `volume=${volume}` : ""
        const audioFilter = [eqFilters, volumeFilter].filter(Boolean).join(",")

        const args = [
          "-i",
          inputName,
          "-af",
          audioFilter,
          "-c:v",
          "copy",
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
          10 * 60 * 1000,
          "Export took too long and was stopped.",
        )

        const data = await ffmpeg.readFile(outputName)
        const blob = new Blob([data as BlobPart], {
          type: getVideoMimeType(outputName),
        })
        return new File([blob], outputName, {
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
    [load, getFFmpeg, resetFFmpeg],
  )

  return { loaded, loading, progress, exporting, error, load, processVideo }
}

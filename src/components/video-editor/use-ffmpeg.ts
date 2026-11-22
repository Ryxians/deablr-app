import { useCallback, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"
import { buildExportPlan } from "./export-plan"
import type { ExportInputs } from "./export-plan"
import type { VideoEdits } from "./types"

const LOAD_TIMEOUT_MS = 120_000
const REMUX_TIMEOUT_MS = 10 * 60 * 1000
/** Re-encoding every frame in wasm is far slower than copying. */
const REENCODE_TIMEOUT_MS = 60 * 60 * 1000

export class ExportCancelledError extends Error {
  constructor() {
    super("Export cancelled")
    this.name = "ExportCancelledError"
  }
}

function getOutputName(filename: string) {
  const dot = filename.lastIndexOf(".")
  const base = (dot > 0 ? filename.slice(0, dot) : filename) || "video"
  return `${base}-edited.mp4`
}

function getExtension(filename: string, fallback: string) {
  const dot = filename.lastIndexOf(".")
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : ""
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : fallback
}

/** "time=00:01:02.50" in ffmpeg's status line → seconds. */
function parseLogTime(message: string) {
  const match = /time=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(message)
  if (!match) return null
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
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
  const cancelledRef = useRef(false)
  // Read through a function: TS would otherwise narrow the ref after the
  // reset at the top of an export and treat later checks as constant.
  const wasCancelled = () => cancelledRef.current
  /** Length of the output being encoded, so log times become a percentage. */
  const outputDurationRef = useRef(0)
  /** While probing, log lines are captured here instead of driving progress. */
  const probeLogRef = useRef<Array<string> | null>(null)
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
        if (probeLogRef.current) {
          probeLogRef.current.push(message)
          return
        }
        console.log(message)
        const seconds = parseLogTime(message)
        const total = outputDurationRef.current
        if (seconds !== null && total > 0) {
          setProgress(Math.min(99, Math.round((seconds / total) * 100)))
        }
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
    probeLogRef.current = null
    setLoaded(false)
    setLoading(false)
    setExporting(false)
    processingRef.current = false
  }, [])

  const load = useCallback(async () => {
    if (loaded && ffmpegRef.current) return
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
          await ffmpeg.load({ coreURL, wasmURL }, { signal: controller.signal })
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
        setError(
          timedOut
            ? "Loading ffmpeg.wasm timed out. Please try again."
            : message
        )
        console.error("ffmpeg.wasm load error:", err)
        throw err
      } finally {
        setLoading(false)
        loadPromiseRef.current = null
      }
    })()

    await loadPromiseRef.current
  }, [loaded, getFFmpeg, resetFFmpeg])

  /** Runs `ffmpeg -i` on a file and checks the stream list for audio. */
  const probeHasAudio = useCallback(async (ffmpeg: FFmpeg, name: string) => {
    probeLogRef.current = []
    try {
      await ffmpeg.exec(["-hide_banner", "-i", name])
      return probeLogRef.current.some((line) =>
        /Stream #\d+:\d+.*: Audio:/.test(line)
      )
    } finally {
      probeLogRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    if (!processingRef.current) return
    cancelledRef.current = true
    // Terminating the worker is the only way to stop a running exec.
    resetFFmpeg()
  }, [resetFFmpeg])

  const processVideo = useCallback(
    async (mainFile: File, edits: VideoEdits) => {
      if (processingRef.current) {
        throw new Error("An export is already in progress")
      }
      processingRef.current = true
      cancelledRef.current = false
      const written: Array<string> = []

      try {
        setExporting(true)
        setProgress(0)
        setError(null)
        await load()

        const ffmpeg = getFFmpeg()
        const write = async (file: File, name: string) => {
          await ffmpeg.writeFile(name, await fetchFile(file))
          written.push(name)
          return { name, hasAudio: await probeHasAudio(ffmpeg, name) }
        }

        const inputs: ExportInputs = {
          main: await write(
            mainFile,
            `main${getExtension(mainFile.name, ".mp4")}`
          ),
          layers: [],
          audioTracks: [],
        }
        for (const [i, layer] of edits.layers.entries()) {
          inputs.layers.push(
            await write(
              layer.file,
              `layer${i}${getExtension(layer.file.name, ".mp4")}`
            )
          )
        }
        for (const [i, track] of edits.audioTracks.entries()) {
          inputs.audioTracks.push(
            await write(
              track.file,
              `audio${i}${getExtension(track.file.name, ".m4a")}`
            )
          )
        }

        const outputName = "output.mp4"
        const plan = buildExportPlan(edits, inputs, outputName)
        outputDurationRef.current = plan.duration
        console.log("ffmpeg", plan.args.join(" "))

        const code = await withTimeout(
          ffmpeg.exec(plan.args),
          plan.reencode ? REENCODE_TIMEOUT_MS : REMUX_TIMEOUT_MS,
          "Export took too long and was stopped."
        )
        if (code !== 0) {
          throw new Error(
            "ffmpeg couldn't process these files. Try a different format (MP4 works best)."
          )
        }

        const data = await ffmpeg.readFile(outputName)
        written.push(outputName)
        setProgress(100)

        return new File([data as BlobPart], getOutputName(mainFile.name), {
          type: "video/mp4",
        })
      } catch (err) {
        if (wasCancelled()) {
          setError(null)
          throw new ExportCancelledError()
        }
        const message = err instanceof Error ? err.message : "Export failed"
        if (/too long/i.test(message)) {
          resetFFmpeg()
        }
        setError(message)
        console.error("ffmpeg export error:", err)
        throw err
      } finally {
        // Free the wasm filesystem; big inputs otherwise pile up in memory.
        const ffmpeg = ffmpegRef.current
        if (ffmpeg && !wasCancelled()) {
          for (const name of written) {
            await ffmpeg.deleteFile(name).catch(() => {})
          }
        }
        outputDurationRef.current = 0
        setExporting(false)
        processingRef.current = false
      }
    },
    [load, getFFmpeg, probeHasAudio, resetFFmpeg]
  )

  return {
    loaded,
    loading,
    progress,
    exporting,
    error,
    load,
    processVideo,
    cancel,
  }
}

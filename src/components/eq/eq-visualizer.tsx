import { useEffect, useRef } from "react"

interface EQVisualizerProps {
  analyser: AnalyserNode | null
  show: boolean
}

export function EQVisualizer({ analyser, show }: EQVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!show || !analyser) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const barWidth = width / bufferLength
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] ?? 0
        const percent = value / 255
        const barHeight = percent * height
        const x = i * barWidth
        const y = height - barHeight

        const gradient = ctx.createLinearGradient(0, height, 0, 0)
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.4)")
        gradient.addColorStop(1, "rgba(34, 197, 94, 0.85)")
        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth - 1, barHeight)
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, show])

  if (!show) return null

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={120}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  )
}

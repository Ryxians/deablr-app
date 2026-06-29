import { createFileRoute } from "@tanstack/react-router"
import { EQApp } from "@/components/eq/eq-app"

export const Route = createFileRoute("/eq")({
  component: EQ,
})

function EQ() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold text-2xl border-b border-border mb-2 pb-2">
          EQ
        </h2>
        <p className="text-muted-foreground mb-6">
          Upload a video, shape its sound with a live EQ, compare before/after,
          and export the processed video — all in your browser using wasm
          ffmpeg.
        </p>
      </section>

      <EQApp />
    </div>
  )
}

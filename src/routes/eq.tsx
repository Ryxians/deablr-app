import { createFileRoute } from "@tanstack/react-router"
import { EQApp } from "@/components/eq/eq-app"
import { PageHeader } from "@/components/page-header"

export const Route = createFileRoute("/eq")({
  component: EQ,
})

function EQ() {
  return (
    <div>
      <PageHeader
        path="projects/eq"
        title="EQ"
        description="Upload a video, shape its sound with a live EQ, compare before and after, then export. Everything runs in your browser with ffmpeg.wasm."
      />
      <EQApp />
    </div>
  )
}

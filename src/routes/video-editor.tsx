import { createFileRoute } from "@tanstack/react-router"
import { VideoEditorApp } from "@/components/video-editor/video-editor-app"
import { PageHeader } from "@/components/page-header"

export const Route = createFileRoute("/video-editor")({
  component: VideoEditor,
})

function VideoEditor() {
  return (
    <div>
      <PageHeader
        path="projects/video-editor"
        title="Video Editor"
        description="Upload a video, change its speed, shape its sound with a live EQ, compare before and after, then export. Everything runs in your browser with ffmpeg.wasm."
      />
      <VideoEditorApp />
    </div>
  )
}

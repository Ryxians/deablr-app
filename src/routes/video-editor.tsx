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
        description="Trim, crop and speed up or slow down a video, layer other clips on top, mix in music, and shape the sound with a live EQ. Everything runs in your browser with ffmpeg.wasm."
      />
      <VideoEditorApp />
    </div>
  )
}

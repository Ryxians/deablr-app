import { createFileRoute, redirect } from "@tanstack/react-router"

// The EQ grew into the Video Editor; keep old links working.
export const Route = createFileRoute("/eq")({
  beforeLoad: () => {
    throw redirect({ to: "/video-editor", statusCode: 301 })
  },
})

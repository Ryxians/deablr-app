import { createFileRoute } from "@tanstack/react-router"
import { NotFound } from "@/components/NotFound"

export const Route = createFileRoute("/not-found")({
  component: NotFound,
})

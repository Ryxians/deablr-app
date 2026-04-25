import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/web-games")({
  component: WebGames,
})

function WebGames() {
  return (
    <div>
      <section className="mb-6">
        <h2 className="font-bold text-xl border-b border-border mb-2">
          Web Games
        </h2>
        <p>Coming soon...</p>
      </section>
    </div>
  )
}

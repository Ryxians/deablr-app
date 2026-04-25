import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/not-found")({
  component: NotFound,
})

function NotFound() {
  return (
    <main className="p-8 leading-relaxed">
      <section className="mb-6">
        <h2 className="font-bold text-xl border-b border-border mb-2">
          Not Found
        </h2>
        <p>Sowwy, this is not a valid page.</p>
      </section>
      <section className="mb-6">
        <img src="/in-your-walls.gif" alt="I am in your walls." />
      </section>
    </main>
  )
}

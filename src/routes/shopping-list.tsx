import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/shopping-list")({
  component: ShoppingList,
})

function ShoppingList() {
  return (
    <div>
      <section className="mb-6">
        <h2 className="font-bold text-xl border-b border-border mb-2">
          Shopping List
        </h2>
        <p>Coming soon...</p>
      </section>
    </div>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { WishlistForm } from "@/components/wishlist/wishlist-form"
import { NotFound } from "@/components/NotFound"
import { PageHeader } from "@/components/page-header"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/wishlist/new")({
  loader: () => getCurrentUser(),
  component: NewWishlistItemPage,
})

function NewWishlistItemPage() {
  const user = Route.useLoaderData()
  if (user?.role !== "admin") return <NotFound />
  return (
    <div>
      <PageHeader path="wishlist/new" title="New Wishlist Item" />
      <WishlistForm />
    </div>
  )
}

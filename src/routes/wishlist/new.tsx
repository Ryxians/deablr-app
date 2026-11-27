import { createFileRoute } from "@tanstack/react-router"
import { WishlistForm } from "@/components/wishlist/wishlist-form"
import { NotFound } from "@/components/NotFound"
import { PageHeader } from "@/components/page-header"
import { getCurrentUser } from "@/server/session"
import { listWishlistCategories } from "@/server/wishlist"

export const Route = createFileRoute("/wishlist/new")({
  loader: async () => {
    const [categories, user] = await Promise.all([
      listWishlistCategories(),
      getCurrentUser(),
    ])
    return { categories, user }
  },
  component: NewWishlistItemPage,
})

function NewWishlistItemPage() {
  const { categories, user } = Route.useLoaderData()
  if (user?.role !== "admin") return <NotFound />
  return (
    <div>
      <PageHeader path="wishlist/new" title="New Wishlist Item" />
      <WishlistForm categories={categories} />
    </div>
  )
}

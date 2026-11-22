import { createFileRoute, notFound } from "@tanstack/react-router"
import { WishlistForm } from "@/components/wishlist/wishlist-form"
import { NotFound } from "@/components/NotFound"
import { PageHeader } from "@/components/page-header"
import { getWishlistItem } from "@/server/wishlist"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/wishlist/$itemId/edit")({
  loader: async ({ params }) => {
    const [item, user] = await Promise.all([
      getWishlistItem({ data: { itemId: params.itemId } }),
      getCurrentUser(),
    ])
    if (!item) throw notFound()
    return { item, user }
  },
  component: EditWishlistItemPage,
})

function EditWishlistItemPage() {
  const { item, user } = Route.useLoaderData()
  if (user?.role !== "admin") return <NotFound />
  return (
    <div>
      <PageHeader path="wishlist/edit" title={`Edit: ${item.name}`} />
      <WishlistForm initial={item} />
    </div>
  )
}

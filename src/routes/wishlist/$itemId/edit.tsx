import { createFileRoute, notFound } from "@tanstack/react-router"
import { WishlistForm } from "@/components/wishlist/wishlist-form"
import { NotFound } from "@/components/NotFound"
import { PageHeader } from "@/components/page-header"
import { getWishlistItem, listWishlistCategories } from "@/server/wishlist"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/wishlist/$itemId/edit")({
  loader: async ({ params }) => {
    const [item, categories, user] = await Promise.all([
      getWishlistItem({ data: { itemId: params.itemId } }),
      listWishlistCategories(),
      getCurrentUser(),
    ])
    if (!item) throw notFound()
    return { item, categories, user }
  },
  component: EditWishlistItemPage,
})

function EditWishlistItemPage() {
  const { item, categories, user } = Route.useLoaderData()
  if (user?.role !== "admin") return <NotFound />
  return (
    <div>
      <PageHeader path="wishlist/edit" title={`Edit: ${item.name}`} />
      <WishlistForm initial={item} categories={categories} />
    </div>
  )
}

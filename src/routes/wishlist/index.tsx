import { Link, createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { WishlistList } from "@/components/wishlist/wishlist-list"
import { Button } from "@/components/ui/button"
import { listWishlist, listWishlistCategories } from "@/server/wishlist"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/wishlist/")({
  loader: async () => {
    const [items, categories, user] = await Promise.all([
      listWishlist(),
      listWishlistCategories(),
      getCurrentUser(),
    ])
    return { items, categories, user }
  },
  component: WishlistPage,
})

function WishlistPage() {
  const { items, categories, user } = Route.useLoaderData()
  const isAdmin = user?.role === "admin"
  return (
    <div>
      <PageHeader
        path="wishlist"
        title="Wishlist"
        description="Things I'm planning to buy, most wanted first."
        actions={
          isAdmin && (
            <Button asChild>
              <Link to="/wishlist/new" data-wishlist-new>
                <Plus />
                New Item
              </Link>
            </Button>
          )
        }
      />
      <WishlistList items={items} categories={categories} canManage={isAdmin} />
    </div>
  )
}

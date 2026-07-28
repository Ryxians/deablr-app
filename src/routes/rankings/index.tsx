import { Link, createFileRoute } from "@tanstack/react-router"
import { RankingsBoard } from "@/components/rankings/rankings-board"
import { Button } from "@/components/ui/button"
import { listRankings } from "@/server/rankings"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/rankings/")({
  loader: async () => {
    const [reviews, user] = await Promise.all([listRankings(), getCurrentUser()])
    return { reviews, user }
  },
  component: RankingsPage,
})

function RankingsPage() {
  const { reviews, user } = Route.useLoaderData()
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rankings</h1>
        {user?.role === "admin" && (
          <Link to="/rankings/new">
            <Button size="sm">New Review</Button>
          </Link>
        )}
      </div>
      <RankingsBoard reviews={reviews} />
    </div>
  )
}

import { Link, createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { RankingsBoard } from "@/components/rankings/rankings-board"
import { Button } from "@/components/ui/button"
import { listRankings } from "@/server/rankings"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/rankings/")({
  loader: async () => {
    const [reviews, user] = await Promise.all([
      listRankings(),
      getCurrentUser(),
    ])
    return { reviews, user }
  },
  component: RankingsPage,
})

function RankingsPage() {
  const { reviews, user } = Route.useLoaderData()
  return (
    <div>
      <PageHeader
        path="rankings"
        title="Rankings"
        description="Everything I've watched, played, and read, scored on Fun and Art. Ten is the best; there is no floor."
        actions={
          user?.role === "admin" && (
            <Button asChild>
              <Link to="/rankings/new">
                <Plus />
                New Review
              </Link>
            </Button>
          )
        }
      />
      <RankingsBoard reviews={reviews} />
    </div>
  )
}

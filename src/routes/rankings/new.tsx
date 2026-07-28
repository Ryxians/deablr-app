import { createFileRoute } from "@tanstack/react-router"
import { ReviewForm } from "@/components/rankings/review-form"
import { NotFound } from "@/components/NotFound"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/rankings/new")({
  loader: () => getCurrentUser(),
  component: NewReviewPage,
})

function NewReviewPage() {
  const user = Route.useLoaderData()
  if (user?.role !== "admin") return <NotFound />
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">New Review</h1>
      <ReviewForm />
    </div>
  )
}

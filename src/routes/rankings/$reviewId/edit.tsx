import { createFileRoute, notFound } from "@tanstack/react-router"
import { ReviewForm } from "@/components/rankings/review-form"
import { NotFound } from "@/components/NotFound"
import { getReview } from "@/server/rankings"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/rankings/$reviewId/edit")({
  loader: async ({ params }) => {
    const [review, user] = await Promise.all([
      getReview({ data: { reviewId: params.reviewId } }),
      getCurrentUser(),
    ])
    if (!review) throw notFound()
    return { review, user }
  },
  component: EditReviewPage,
})

function EditReviewPage() {
  const { review, user } = Route.useLoaderData()
  if (user?.role !== "admin") return <NotFound />
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Edit Review</h1>
      <ReviewForm initial={review} />
    </div>
  )
}

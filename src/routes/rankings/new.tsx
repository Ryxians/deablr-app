import { createFileRoute } from "@tanstack/react-router"
import { ReviewForm } from "@/components/rankings/review-form"
import { NotFound } from "@/components/NotFound"
import { PageHeader } from "@/components/page-header"
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
      <PageHeader path="rankings/new" title="New Review" />
      <ReviewForm />
    </div>
  )
}

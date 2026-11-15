import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ReviewCard } from "@/components/rankings/review-card"
import { SectionHeading } from "@/components/section-heading"
import { averageScore } from "@/lib/rankings"
import { listRankings } from "@/server/rankings"

export const Route = createFileRoute("/")({
  loader: async () => {
    const reviews = await listRankings()
    const top = [...reviews]
      .filter((r) => Object.keys(r.scores).length > 0)
      .sort((a, b) => averageScore(b.scores) - averageScore(a.scores))
      .slice(0, 3)
    return { top }
  },
  component: Home,
})

const quests = [
  "Build Games",
  "Rant against city infrastructure",
  "Gift buying guide",
]

function Home() {
  const { top } = Route.useLoaderData()

  return (
    <div>
      <PageHeader path="home" title="Deablr Home" />

      <p className="max-w-[62ch] text-lg leading-relaxed text-foreground/95 md:text-xl md:leading-relaxed">
        Henlo, I am here! Local fool who likes to talk. Will be{" "}
        <mark className="highlight-stripes">
          an extremist if it&apos;s funny
        </mark>
        . Die hard Oklahoman (Okie). Red Truck. God &amp; State. Scooby Doo is
        the pinnacle of animation (pre-youtube). Broken Arrow native.
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
        <section>
          <SectionHeading>Quest Log</SectionHeading>
          <ol>
            {quests.map((quest, i) => (
              <li
                key={quest}
                className="flex items-baseline gap-3 border-b border-dashed border-border/80 py-3 first:pt-1"
              >
                <span
                  aria-hidden
                  className="font-mono text-sm font-bold text-secondary"
                >
                  [ ]
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  Q{i + 1}
                </span>
                <span className="leading-snug">{quest}</span>
              </li>
            ))}
          </ol>
        </section>

        {top.length > 0 && (
          <section>
            <SectionHeading
              action={
                <Link
                  to="/rankings"
                  className="group inline-flex min-h-10 items-center gap-1.5 rounded-md font-mono text-xs font-semibold text-secondary outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  All rankings
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              }
            >
              Top of the Rankings
            </SectionHeading>
            <ol className="grid grid-cols-3 gap-3 sm:gap-5">
              {top.map((item) => (
                <li key={item.reviewId}>
                  <ReviewCard item={item} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}

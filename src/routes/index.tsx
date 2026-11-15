import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SectionHeading } from "@/components/section-heading"
import { averageScore, formatAverage } from "@/lib/rankings"
import { listRankings } from "@/server/rankings"

export const Route = createFileRoute("/")({
  loader: async () => {
    const reviews = await listRankings()
    const top = [...reviews]
      .filter((r) => Object.keys(r.scores).length > 0)
      .sort((a, b) => averageScore(b.scores) - averageScore(a.scores))
      .slice(0, 5)
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

      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_17rem] md:gap-12">
        <div className="min-w-0">
          <p className="text-lg leading-relaxed text-foreground/95 md:text-xl md:leading-relaxed">
            Henlo, I am here! Local fool who likes to talk. Will be{" "}
            <mark className="highlight-stripes">
              an extremist if it&apos;s funny
            </mark>
            . Die hard Oklahoman (Okie). Red Truck. God &amp; State. Scooby Doo
            is the pinnacle of animation (pre-youtube). Broken Arrow native.
          </p>

          <section className="mt-10 md:mt-12">
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
        </div>

        {top.length > 0 && (
          <aside>
            <SectionHeading
              action={
                <Link
                  to="/rankings"
                  className="group inline-flex min-h-10 items-center gap-1.5 rounded-md font-mono text-xs font-semibold text-secondary outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  All
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              }
            >
              Top Ranked
            </SectionHeading>
            <ol>
              {top.map((item, i) => (
                <li key={item.reviewId}>
                  <Link
                    to="/rankings/$reviewId"
                    params={{ reviewId: item.reviewId }}
                    className="group flex items-center gap-3 border-b border-dashed border-border/80 py-2.5 outline-none first:pt-0 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="w-4 font-mono text-sm font-bold text-secondary">
                      {i + 1}
                    </span>
                    <img
                      src={item.artUrl}
                      alt=""
                      className="aspect-[2/3] w-10 shrink-0 rounded-md object-cover ring-1 ring-border/80 transition-transform group-hover:-rotate-3"
                    />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold underline-offset-2 group-hover:underline">
                      {item.title}
                    </span>
                    <span className="font-mono text-[15px] font-extrabold tabular-nums">
                      {formatAverage(averageScore(item.scores))}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  )
}

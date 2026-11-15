import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight, Gamepad2, Trophy, UserRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SectionHeading } from "@/components/section-heading"

export const Route = createFileRoute("/")({
  component: Home,
})

const quests = [
  "Build Games",
  "Rant against city infrastructure",
  "Gift buying guide",
]

const rooms: Array<{
  to: "/about-me" | "/rankings" | "/projects"
  label: string
  blurb: string
  icon: LucideIcon
}> = [
  {
    to: "/about-me",
    label: "About Me",
    blurb: "The local fool, in detail",
    icon: UserRound,
  },
  {
    to: "/rankings",
    label: "Rankings",
    blurb: "Shows, games & books, scored",
    icon: Trophy,
  },
  {
    to: "/projects",
    label: "Projects",
    blurb: "Games and tools I've built",
    icon: Gamepad2,
  },
]

function Home() {
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

      <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-8">
        <section>
          <SectionHeading>Quest Log</SectionHeading>
          <ol className="space-y-2">
            {quests.map((quest, i) => (
              <li
                key={quest}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3.5 py-3"
              >
                <span className="font-mono text-xs font-bold text-secondary">
                  Q{i + 1}
                </span>
                <span className="leading-snug">{quest}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionHeading>Around the Abode</SectionHeading>
          <ul className="space-y-2">
            {rooms.map(({ to, label, blurb, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex items-center gap-3.5 rounded-lg border border-border/70 bg-card px-3.5 py-3 transition-colors outline-none hover:border-primary/60 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm font-bold">
                      {label}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {blurb}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

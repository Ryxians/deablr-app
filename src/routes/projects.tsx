import { Link, createFileRoute } from "@tanstack/react-router"
import {
  ArrowRight,
  MessageCircle,
  SlidersHorizontal,
  SpellCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Chip } from "@/components/ui/chip"

export const Route = createFileRoute("/projects")({
  component: Projects,
})

const projects: Array<{
  to: "/real-talk" | "/eq" | "/wordle"
  title: string
  kind: string
  description: string
  cta: string
  icon: LucideIcon
}> = [
  {
    to: "/real-talk",
    title: "Real Talk",
    kind: "Party game",
    description:
      "Players take turns drawing random questions from a numbered deck and answering them honestly.",
    cta: "Play",
    icon: MessageCircle,
  },
  {
    to: "/eq",
    title: "EQ",
    kind: "Audio tool",
    description:
      "Upload a video, tweak its EQ, compare before and after, and export the result. Runs in your browser.",
    cta: "Open",
    icon: SlidersHorizontal,
  },
  {
    to: "/wordle",
    title: "Wordle Helper",
    kind: "Word game",
    description:
      "Filters the word list by the letters you know so you can stop staring at the grid.",
    cta: "Open",
    icon: SpellCheck,
  },
]

function Projects() {
  return (
    <div>
      <PageHeader
        path="projects"
        title="Projects"
        description="Games, tools, and experiments built for this digital abode."
      />

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(({ to, title, kind, description, cta, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full flex-col rounded-xl border border-border/80 bg-card p-5 transition-colors outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <Chip tone="muted" size="xs">
                  {kind}
                </Chip>
              </div>
              <h2 className="mt-4 text-lg font-bold tracking-tight">{title}</h2>
              <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-primary">
                {cta} {title}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

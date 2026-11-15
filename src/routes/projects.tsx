import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export const Route = createFileRoute("/projects")({
  component: Projects,
})

const projects: Array<{
  to: "/real-talk" | "/eq" | "/wordle"
  title: string
  kind: string
  description: string
  cta: string
}> = [
  {
    to: "/real-talk",
    title: "Real Talk",
    kind: "party game",
    description:
      "Players take turns drawing random questions from a numbered deck and answering them honestly.",
    cta: "Play",
  },
  {
    to: "/eq",
    title: "EQ",
    kind: "audio tool",
    description:
      "Upload a video, tweak its EQ, compare before and after, and export the result. Runs in your browser.",
    cta: "Open",
  },
  {
    to: "/wordle",
    title: "Wordle Helper",
    kind: "word game",
    description:
      "Filters the word list by the letters you know so you can stop staring at the grid.",
    cta: "Open",
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

      <ul className="grid gap-4 md:grid-cols-3">
        {projects.map(({ to, title, kind, description, cta }, i) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full flex-col rounded-xl border border-border/80 bg-card p-5 transition-colors outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <p className="font-mono text-xs text-muted-foreground">
                <span className="font-bold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mx-2 text-border">/</span>
                {kind}
              </p>
              <h2 className="mt-3 text-xl font-extrabold tracking-tight">
                {title}
              </h2>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-secondary group-hover:text-foreground">
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

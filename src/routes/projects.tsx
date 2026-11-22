import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/projects")({
  component: Projects,
})

/** A tiny stack of question cards, top one face up. */
function RealTalkArt() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-10 top-5 bottom-3 rotate-6 rounded-lg bg-muted" />
      <div className="absolute inset-x-8 top-4 bottom-4 -rotate-3 rounded-lg bg-[oklch(0.45_0.09_263)]" />
      <div className="absolute inset-x-6 top-3 bottom-5 flex flex-col justify-between rounded-lg bg-foreground p-3 text-[oklch(0.25_0.06_265)] shadow-lift">
        <span className="font-mono text-[11px] font-bold text-primary">
          #80
        </span>
        <span className="text-sm leading-tight font-bold">
          What trait do you envy in others?
        </span>
      </div>
    </div>
  )
}

/** Six slider faders at a smiley-curve EQ setting, played at 2×. */
function VideoEditorArt() {
  const gains = [70, 45, 30, 35, 55, 75]
  return (
    <div className="relative flex h-full items-end justify-center gap-4 px-6 pt-4 pb-3">
      {gains.map((g, i) => (
        <div key={i} className="relative h-full w-1.5 rounded-full bg-muted">
          <span
            className="absolute left-1/2 size-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary ring-2 ring-well"
            style={{ bottom: `${g}%` }}
          />
        </div>
      ))}
      <span className="absolute top-3 right-4 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-secondary-foreground">
        2×
      </span>
    </div>
  )
}

/** A Wordle row spelling ABODE, scored. */
function WordleArt() {
  const tiles: Array<[string, string]> = [
    ["A", "bg-accent text-accent-foreground"],
    ["B", "bg-muted text-foreground"],
    ["O", "bg-sun text-[oklch(0.25_0.06_80)]"],
    ["D", "bg-muted text-foreground"],
    ["E", "bg-accent text-accent-foreground"],
  ]
  return (
    <div className="flex h-full items-center justify-center gap-1.5">
      {tiles.map(([letter, tone], i) => (
        <span
          key={i}
          className={cn(
            "grid size-10 place-items-center rounded-md font-mono text-lg font-extrabold",
            tone
          )}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

const projects: Array<{
  to: "/real-talk" | "/video-editor" | "/wordle"
  title: string
  kind: string
  description: string
  cta: string
  art: ReactNode
}> = [
  {
    to: "/real-talk",
    title: "Real Talk",
    kind: "party game",
    description:
      "Players take turns drawing random questions from a numbered deck and answering them honestly.",
    cta: "Play",
    art: <RealTalkArt />,
  },
  {
    to: "/video-editor",
    title: "Video Editor",
    kind: "video tool",
    description:
      "Trim, crop, change speed, layer clips and mix in music, then export. Runs entirely in your browser.",
    cta: "Open",
    art: <VideoEditorArt />,
  },
  {
    to: "/wordle",
    title: "Wordle Helper",
    kind: "word game",
    description:
      "Filters the word list by the letters you know so you can stop staring at the grid.",
    cta: "Open",
    art: <WordleArt />,
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

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map(({ to, title, kind, description, cta, art }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border/60 transition-[box-shadow,transform] outline-none hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/70 focus-visible:ring-[3px] focus-visible:ring-ring/60"
            >
              <div aria-hidden className="h-36 bg-well">
                {art}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="font-mono text-xs text-muted-foreground">
                  {kind}
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight">
                  {title}
                </h2>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-secondary group-hover:text-foreground">
                  {cta} {title}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

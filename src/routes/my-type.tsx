import { createFileRoute } from "@tanstack/react-router"
import { Check, Lock, LockOpen, Shuffle } from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"
import { PennyFormLayout } from "@/components/form-bits"
import { PageHeader } from "@/components/page-header"
import { SectionHeading } from "@/components/section-heading"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * An easter egg: reachable from the heart on About Me (and the Manifesto),
 * never from the nav. Visitors clear a mock security form before the file
 * opens.
 */
export const Route = createFileRoute("/my-type")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: MyType,
})

const youngestAgeToDate =
  (new Date().getFullYear() - new Date(2000, 5, 10).getFullYear()) / 2 + 7

const fieldNotes: Array<ReactNode> = [
  <>
    I would never ask out a woman under the age of 21, but I would date a woman
    who is half my age plus 7 ({youngestAgeToDate}).
  </>,
  "I would never date a woman who rejects the Nicene Creed.",
  "I find light skinned women more attractive than dark skinned women.",
  "I find women with extreme views more attractive than women with no views.",
  "I will not date a woman on birth control.",
  "I find tattoos very unflattering.",
]

type Exhibit =
  | { kind: "image"; src: string; caption: string }
  | { kind: "video"; src: string; caption: string }

const exhibits: Array<Exhibit> = [
  {
    kind: "image",
    src: "https://m.media-amazon.com/images/M/MV5BMjI3NzY1MzU0Ml5BMl5BanBnXkFtZTcwNDc1MjUzNA@@._V1_.jpg",
    caption: "Alexandra Daddario",
  },
  {
    kind: "image",
    src: "https://media.themoviedb.org/t/p/w600_and_h900_face/1F0fCPNhb5W0WyFe8Tszfbx1DEp.jpg",
    caption: "Melissa Benoist",
  },
  {
    kind: "image",
    src: "https://www.thehandbook.com/cdn-cgi/image/width=300,height=300,fit=cover,q=80,format=webp/https://files.thehandbook.com/uploads/2021/10/43142522-480626975782845-6418668413001924608-n.jpg",
    caption: "Alexandra Botez",
  },
  {
    kind: "image",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Mary_Elizabeth_Winstead_by_Gage_Skidmore.jpg/1280px-Mary_Elizabeth_Winstead_by_Gage_Skidmore.jpg",
    caption: "Mary Elizabeth Winstead",
  },
  {
    kind: "image",
    src: "https://i.pinimg.com/736x/91/39/ab/9139ab61e884ab26c4e47c5b4e4f50e5.jpg",
    caption: "Emily VanCamp",
  },
  {
    kind: "image",
    src: "https://i.pinimg.com/236x/05/55/53/05555379b6c1650cbd0284e11603bd8b.jpg",
    caption: "Victoria Justice",
  },
  {
    kind: "image",
    src: "https://m.media-amazon.com/images/M/MV5BMzgyNDYwZWEtM2ZhYy00MjNmLThkYTMtMzBhMWFlODIwMjI2XkEyXkFqcGc@._V1_QL75_UX403_.jpg",
    caption: "Phoebe Cates",
  },
  {
    kind: "image",
    src: "https://www.comingsoon.net/wp-content/uploads/sites/3/2019/01/JJL-header.jpg",
    caption: "Jennifer Jason Leigh",
  },
  {
    kind: "image",
    src: "https://media1.tenor.com/m/ugZ4MdSxr9MAAAAd/rascal-does-not-dream-of-a-knapsack-kid-mai-sakurajima.gif",
    caption: "Mai Sakurajima",
  },
  {
    kind: "image",
    src: "https://media1.tenor.com/m/FesEnU-SLqoAAAAd/rascal-does-not-dream-of-a-knapsack-kid-mai-sakurajima.gif",
    caption: "Mai Sakurajima, again",
  },
  {
    kind: "video",
    src: "https://www.youtube.com/embed/C-CYwNz3z8w?si=g4XKdAZCru9V-T_8",
    caption: "Exhibit: video",
  },
]

const MIDDLE_NAME = "brian"

const clearances = [
  {
    key: "noJudging",
    label: "I agree that I will not judge Jared for his perverted eyes.",
  },
  {
    key: "wantsPhotos",
    label: "I want to see photos of women right now.",
  },
  {
    key: "notHisType",
    label:
      "I acknowledge that Jared is not attracted to me, and will not be offended that I am not his type.",
  },
] as const

type ClearanceKey = (typeof clearances)[number]["key"]

function shuffled<T>(items: Array<T>): Array<T> {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** A hotlinked photo; if the host blocks it, show a stand-in instead. */
function ExhibitPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="grid aspect-[3/4] w-full place-items-center rounded-sm bg-[oklch(0.9_0.02_240)] p-4 text-center">
        <span className="font-mono text-xs text-[oklch(0.35_0.05_265)]">
          Photo went missing.
          <br />
          Use your imagination.
        </span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className="aspect-[3/4] w-full rounded-sm bg-[oklch(0.88_0.01_95)] object-cover"
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

/** Slight, alternating tilts so the wall reads as pinned-up polaroids. */
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0"]

function MyType() {
  const [checked, setChecked] = useState<Record<ClearanceKey, boolean>>({
    noJudging: false,
    wantsPhotos: false,
    notHisType: false,
  })
  const [middleName, setMiddleName] = useState("")
  // Only ever rendered after the visitor interacts, so a client-side shuffle
  // can't cause a hydration mismatch.
  const [wall, setWall] = useState(() => shuffled(exhibits))

  const nameAttempt = middleName.trim().toLowerCase()
  const nameCorrect = nameAttempt === MIDDLE_NAME
  const nameWrong =
    nameAttempt.length >= 3 && !MIDDLE_NAME.startsWith(nameAttempt)
  const cleared =
    clearances.filter((c) => checked[c.key]).length + (nameCorrect ? 1 : 0)
  const total = clearances.length + 1
  const granted = cleared === total

  function lockUp() {
    setChecked({ noJudging: false, wantsPhotos: false, notHisType: false })
    setMiddleName("")
  }

  return (
    <div>
      <PageHeader
        path="about-me/my-type"
        title="My Type"
        description={
          granted
            ? "The file is open. Viewer discretion is advised."
            : "A classified file. Complete the clearance form to open it."
        }
      />

      <div>
        {granted ? (
          <div className="flex flex-nowrap items-center gap-3 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3">
            <LockOpen className="size-5 text-accent" />
            <p className="font-mono text-sm font-bold tracking-wide text-accent uppercase">
              Access granted
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={lockUp}
            >
              <Lock />
              <span className="sm:hidden">Lock</span>
              <span className="hidden sm:inline">Lock it back up</span>
            </Button>
          </div>
        ) : (
          <PennyFormLayout caption="Penny is guarding this file.">
            <section
              aria-labelledby="clearance-title"
              className="rounded-xl border border-border/50 bg-card p-4 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="clearance-title"
                  className="flex items-center gap-2 font-mono text-sm font-bold"
                >
                  <Lock className="size-4 text-primary" />
                  Clearance required
                </h2>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {cleared}/{total} cleared
                </span>
              </div>
              <div
                aria-hidden
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-well"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${(cleared / total) * 100}%` }}
                />
              </div>

              <ul className="mt-5 space-y-2.5">
                {clearances.map(({ key, label }) => (
                  <li key={key}>
                    <label
                      htmlFor={`clearance-${key}`}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors",
                        checked[key]
                          ? "border-secondary/60 bg-secondary/10"
                          : "border-border/70 bg-well/50 hover:border-border"
                      )}
                    >
                      <Checkbox
                        id={`clearance-${key}`}
                        checked={checked[key]}
                        onCheckedChange={(value) =>
                          setChecked((prev) => ({ ...prev, [key]: !!value }))
                        }
                        className="mt-0.5"
                      />
                      <span className="text-[15px] leading-snug">{label}</span>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2">
                <Label htmlFor="clearance-middle-name">
                  Security question: Jared&apos;s middle name
                </Label>
                <div className="relative">
                  <Input
                    id="clearance-middle-name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="It's not Danger"
                    aria-invalid={nameWrong || undefined}
                    className="pr-10 font-mono"
                  />
                  {nameCorrect && (
                    <Check
                      aria-label="Correct"
                      className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-accent"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <p
                  aria-live="polite"
                  className={cn(
                    "font-mono text-xs",
                    nameWrong ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {nameWrong
                    ? "Nope. Penny is disappointed in you."
                    : "Friends and family should know this one."}
                </p>
              </div>
            </section>
          </PennyFormLayout>
        )}
      </div>

      {granted && (
        <div className="mt-10 animate-in space-y-10 duration-500 fade-in slide-in-from-bottom-2 md:mt-12 md:space-y-14">
          <section>
            <SectionHeading>Field Notes</SectionHeading>
            <ol className="md:grid md:grid-cols-2 md:gap-x-10">
              {fieldNotes.map((note, i) => (
                <li
                  key={i}
                  className="flex gap-4 border-b border-dashed border-border/80 py-3.5"
                >
                  <span className="font-mono text-sm font-bold text-primary tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[17px] leading-relaxed">{note}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <SectionHeading
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWall((w) => shuffled(w))}
                >
                  <Shuffle />
                  Reshuffle
                </Button>
              }
            >
              Exhibits
            </SectionHeading>
            <p className="-mt-1 mb-8 flex items-center gap-3 text-[15px] text-muted-foreground">
              <img
                src="https://media1.tenor.com/m/XsA88wdl0poAAAAd/tex-avery-wolf-awooga-cartoon-awooga.gif"
                alt="Cartoon wolf going awooga"
                className="size-14 shrink-0 rotate-6 rounded-full object-cover ring-2 ring-primary"
                referrerPolicy="no-referrer"
              />
              A random assortment of thoughts and photos of women.
            </p>

            <ul className="grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">
              {wall.map((exhibit, i) => (
                <li
                  key={exhibit.src}
                  className={cn(
                    exhibit.kind === "video" && "col-span-2",
                    "transition-transform duration-200 hover:z-10 hover:scale-[1.03] hover:rotate-0",
                    TILTS[i % TILTS.length]
                  )}
                >
                  <figure className="rounded-md bg-[oklch(0.96_0.01_95)] p-2 pb-0 shadow-[0_6px_0_0_oklch(0.18_0.06_266/0.45)]">
                    {exhibit.kind === "video" ? (
                      <iframe
                        className="aspect-video w-full rounded-sm bg-black"
                        src={exhibit.src}
                        title={exhibit.caption}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        loading="lazy"
                      />
                    ) : (
                      <ExhibitPhoto src={exhibit.src} alt={exhibit.caption} />
                    )}
                    <figcaption className="line-clamp-2 min-h-[3.25em] px-1 py-2 text-center font-mono text-xs leading-tight font-semibold text-balance text-[oklch(0.25_0.05_265)]">
                      {exhibit.caption}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

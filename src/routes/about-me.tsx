import { createFileRoute } from "@tanstack/react-router"
import {
  Baby,
  Ban,
  Church,
  GraduationCap,
  Heart,
  MapPin,
  PawPrint,
  Ruler,
  Wine,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SectionHeading } from "@/components/section-heading"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export const Route = createFileRoute("/about-me")({
  component: AboutMe,
})

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }
  return age
}

const goodToKnow: Array<{
  title: string
  description: string
  icon: LucideIcon
}> = [
  {
    title: "Bachelor's degree",
    description: "Educated fool",
    icon: GraduationCap,
  },
  { title: "Catholic", description: "God Oriented", icon: Church },
  { title: "No Pets", description: "Want pets", icon: PawPrint },
  { title: "No kids", description: "Want kids", icon: Baby },
  { title: "Marijuana Gross", description: "hard pass", icon: Ban },
  { title: "Wine Prince", description: "Parents own a winery", icon: Wine },
]

const playlists = [
  "https://open.spotify.com/embed/playlist/4Zxs6hjuX3HO5pd97OwyZ3?utm_source=generator&si=521fecaba4dc46f5",
  "https://open.spotify.com/embed/playlist/3xxRaISAq1WBippP2JdHoE?utm_source=generator&si=c73d9aa231a94db1",
  "https://open.spotify.com/embed/playlist/2FiV8RJINYdcYW0zO8mR7A?utm_source=generator&si=83caf61b6eb74255",
  "https://open.spotify.com/embed/playlist/4N7mTgHCyMjxyhiF2XzfpG?utm_source=generator&si=341fc5b347e346b9",
  "https://open.spotify.com/embed/playlist/2wFOez3ihkVNqrrl7P2n7J?utm_source=generator&si=933981332b20498b",
]

const morePhotos = [
  "/jared/IMG_6476.PNG",
  "/jared/IMG_6477.PNG",
  "/jared/IMG_6478.PNG",
  "/jared/IMG_6479.PNG",
  "/jared/IMG_6480.PNG",
]

function AboutMe() {
  const age = calculateAge(new Date(2000, 4, 10))

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader path="about-me" title="About Me" />

      <section className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <img
          src="/jared/profile.JPG"
          alt="Jared"
          className="aspect-square w-56 shrink-0 rounded-2xl object-cover ring-1 ring-border/80 sm:w-60"
        />
        <div className="min-w-0">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Jared, <span className="text-primary">{age}</span>
          </h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {[
              { icon: MapPin, label: "Broken Arrow, OK" },
              { icon: Ruler, label: `5'8"` },
              { icon: Heart, label: "Long-term" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-border/80 bg-well/60 px-3 py-1 font-mono text-xs text-muted-foreground"
              >
                <Icon className="size-3.5 text-secondary" />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[17px] leading-relaxed text-foreground/95">
            Henlo, I am here! Local fool who likes to talk. Will be an extremist
            if it&apos;s funny. Die hard Oklahoman (Okie). Red Truck. God &amp;
            State. Scooby Doo is the pinnacle of animation (pre-youtube). Broken
            Arrow native.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading>Good to Know</SectionHeading>
        <ul className="grid gap-3 sm:grid-cols-2">
          {goodToKnow.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className="flex items-center gap-3.5 rounded-lg border border-border/70 bg-card px-4 py-3.5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-sm font-bold">
                  {title}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <Carousel>
          <SectionHeading
            action={
              <div className="flex gap-1.5">
                <CarouselPrevious className="static size-8 translate-y-0" />
                <CarouselNext className="static size-8 translate-y-0" />
              </div>
            }
          >
            On Repeat
          </SectionHeading>
          <CarouselContent>
            {playlists.map((src, index) => (
              <CarouselItem key={src}>
                <div className="h-[352px] overflow-hidden rounded-xl bg-well ring-1 ring-border/70">
                  <iframe
                    title={`Spotify playlist ${index + 1}`}
                    className="block w-full"
                    src={src}
                    height={352}
                    frameBorder={0}
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      <section className="mt-14">
        <SectionHeading>More Photos</SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {morePhotos.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Jared photo ${index + 1}`}
              className="aspect-square w-full rounded-xl object-cover ring-1 ring-border/70"
              loading="lazy"
            />
          ))}
        </div>
      </section>
    </div>
  )
}

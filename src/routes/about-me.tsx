import { Link, createFileRoute } from "@tanstack/react-router"
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
import { cn } from "@/lib/utils"
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
  "https://open.spotify.com/embed/playlist/4Zxs6hjuX3HO5pd97OwyZ3?utm_source=generator&si=521fecaba4dc46f5&theme=0",
  "https://open.spotify.com/embed/playlist/3xxRaISAq1WBippP2JdHoE?utm_source=generator&si=c73d9aa231a94db1&theme=0",
  "https://open.spotify.com/embed/playlist/2FiV8RJINYdcYW0zO8mR7A?utm_source=generator&si=83caf61b6eb74255&theme=0",
  "https://open.spotify.com/embed/playlist/4N7mTgHCyMjxyhiF2XzfpG?utm_source=generator&si=341fc5b347e346b9&theme=0",
  "https://open.spotify.com/embed/playlist/2wFOez3ihkVNqrrl7P2n7J?utm_source=generator&si=933981332b20498b&theme=0",
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
    <div>
      <PageHeader path="about-me" title="About Me" />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-x-12">
        <section className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-x-8 lg:col-start-1">
          <img
            src="/jared/profile.JPG"
            alt="Jared"
            className="aspect-square w-full rounded-2xl object-cover ring-1 ring-border/80 sm:row-span-2 sm:self-start"
          />
          <div className="min-w-0">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Jared, <span className="text-primary">{age}</span>
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              {[
                { icon: MapPin, label: "Broken Arrow, OK" },
                { icon: Ruler, label: `5'8"` },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 rounded-md border border-border/80 bg-well/60 px-2.5 py-1 font-mono text-xs text-muted-foreground"
                >
                  <Icon className="size-3.5 text-secondary" />
                  {label}
                </li>
              ))}
              <li>
                {/* Easter egg: the heart opens the classified "My Type" file. */}
                <Link
                  to="/my-type"
                  className="group flex items-center gap-1.5 rounded-md border border-border/80 bg-well/60 px-2.5 py-1 font-mono text-xs text-muted-foreground outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <Heart className="size-3.5 text-secondary transition-colors group-hover:fill-primary group-hover:text-primary" />
                  Long-term
                </Link>
              </li>
            </ul>
          </div>
          <p className="col-span-2 text-[17px] leading-relaxed text-foreground/95 sm:col-span-1 sm:col-start-2">
            Henlo, I am here! Local fool who likes to talk. Will be an extremist
            if it&apos;s funny. Die hard Oklahoman (Okie). Red Truck. God &amp;
            State. Scooby Doo is the pinnacle of animation (pre-youtube). Broken
            Arrow native.
          </p>
        </section>

        <section className="mt-10 lg:col-start-2 lg:row-start-1 lg:mt-0">
          <SectionHeading>Good to Know</SectionHeading>
          <dl className="grid sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-1">
            {goodToKnow.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 border-b border-dashed border-border/80 py-3"
              >
                <Icon
                  aria-hidden
                  className="row-span-2 mt-0.5 size-4 text-secondary"
                />
                <dt className="font-mono text-sm font-bold">{title}</dt>
                <dd className="text-[15px] text-muted-foreground">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 md:mt-14 lg:col-span-2">
          <Carousel>
            <SectionHeading
              action={
                <div className="flex gap-1.5">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              }
            >
              On Repeat
            </SectionHeading>
            <CarouselContent>
              {playlists.map((src, index) => (
                <CarouselItem key={src}>
                  <div className="relative h-[352px] overflow-hidden rounded-xl bg-well ring-1 ring-border/70">
                    <span className="absolute inset-0 grid place-items-center font-mono text-xs text-muted-foreground">
                      Loading playlist…
                    </span>
                    <iframe
                      title={`Spotify playlist ${index + 1}`}
                      className="relative block w-full"
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

        <section className="mt-10 md:mt-14 lg:col-span-2">
          <SectionHeading>More Photos</SectionHeading>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {morePhotos.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`Jared photo ${index + 1}`}
                className={cn(
                  "w-full rounded-xl object-cover ring-1 ring-border/70",
                  index === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                )}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

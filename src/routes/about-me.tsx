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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
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
  "https://open.spotify.com/embed/playlist/2wFOez3ihkVNqrrl7P2n7J?utm_source=generator&si=933981332b20498b"
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
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="flex flex-col items-center text-center">
        <img
          src="/jared/profile.JPG"
          alt="Jared"
          className="w-full max-w-sm rounded-3xl object-cover shadow-sm"
        />
        <h1 className="mt-4 text-3xl font-bold">Jared, {age}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Broken Arrow, OK
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-4 w-4" />
            5&apos;8&quot;
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Long-term
          </span>
        </div>
      </section>

      <section>
        <p className="text-center">
          Henlo, I am here! Local fool who likes to talk. Will be an extremist
          if it&apos;s funny. Die hard Oklahoman (Okie). Red Truck. God & State.
          Scooby Doo is the pinnacle of animation (pre-youtube). Broken Arrow
          native.
        </p>
      </section>

      <section>
        <h2 className="mb-3 border-b border-border pb-1 text-xl font-bold">
          Good to Know
        </h2>
        <ItemGroup>
          {goodToKnow.map(({ title, description, icon: Icon }) => (
            <Item key={title}>
              <ItemMedia>
                <Icon className="h-5 w-5 text-primary" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{title}</ItemTitle>
                <ItemDescription>{description}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <section>
        <h2 className="mb-3 border-b border-border pb-1 text-xl font-bold">
          On Repeat
        </h2>
        <div className="px-10 md:px-12">
          <Carousel>
            <CarouselContent>
              {playlists.map((src, index) => (
                <CarouselItem key={src}>
                  <iframe
                    title={`Spotify playlist ${index + 1}`}
                    className="w-full rounded-xl"
                    src={src}
                    height={352}
                    frameBorder={0}
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      <section>
        <h2 className="mb-3 border-b border-border pb-1 text-xl font-bold">
          More Photos
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {morePhotos.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Jared photo ${index + 1}`}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      </section>
    </div>
  )
}

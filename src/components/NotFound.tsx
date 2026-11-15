import { Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFound() {
  return (
    <div className="flex flex-col items-center py-2 text-center md:py-8">
      <p className="font-mono text-6xl font-extrabold tracking-tight text-primary [text-shadow:4px_4px_0_oklch(0.2_0.08_266/0.6)] md:text-7xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight md:text-3xl">
        Sowwy, this is not a valid page.
      </h1>
      <img
        src="/in-your-walls.gif"
        alt="I am in your walls."
        className="mt-6 w-full max-w-[220px] rounded-xl ring-1 ring-border/80"
      />
      <Button asChild className="mt-6">
        <Link to="/">
          <ArrowLeft />
          Back home
        </Link>
      </Button>
    </div>
  )
}

import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/about-me", label: "About Me", also: [] },
  // { to: "/wordle", label: "Wordle" },
  // { to: "/manifesto", label: "Manifesto" },
  { to: "/rankings", label: "Rankings", also: [] },
  { to: "/wishlist", label: "Wishlist", also: [] },
  {
    to: "/projects",
    label: "Projects",
    // Project pages live at the top level but belong under Projects.
    also: ["/real-talk", "/video-editor", "/wordle"],
  },
] as const

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      aria-label="Main"
      className="flex justify-center gap-1 overflow-x-auto border-y border-border/80 bg-well/50 px-2 py-1.5 [scrollbar-width:none] md:gap-2 md:py-2.5"
    >
      {navItems.map((item) => {
        const active =
          pathname === item.to ||
          pathname.startsWith(`${item.to}/`) ||
          (item.also as ReadonlyArray<string>).includes(pathname)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-md px-3.5 font-mono text-xs font-semibold tracking-wider whitespace-nowrap uppercase transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:min-h-10 md:px-4 md:text-[13px]",
              active
                ? "bg-primary/20 text-foreground ring-1 ring-primary/60 ring-inset"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

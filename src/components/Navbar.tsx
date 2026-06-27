import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/about-me", label: "About Me" },
  // { to: "/wordle", label: "Wordle" },
  // { to: "/manifesto", label: "Manifesto" },
  { to: "/shopping-list", label: "Shopping List" },
  { to: "/web-games", label: "Web Games" },
]

export function Navbar() {
  const { location } = useRouterState()
  const currentPath = location.pathname

  return (
    <nav className="scrollbar-none flex justify-start gap-0.5 overflow-x-auto border-b border-border bg-muted/50 px-2 py-2 md:justify-center md:gap-1 md:px-4 md:py-3">
      {navItems.map((item) => {
        const isActive = currentPath === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "relative rounded-md px-2 py-1.5 text-[10px] font-medium whitespace-nowrap uppercase transition-all duration-200 md:px-4 md:py-2 md:text-sm md:tracking-wide",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary md:w-8" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

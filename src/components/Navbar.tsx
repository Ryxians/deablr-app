import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "About Me" },
  { to: "/wordle", label: "Wordle" },
  { to: "/manifesto", label: "Manifesto" },
  { to: "/shopping-list", label: "Shopping List" },
  { to: "/web-games", label: "Web Games" },
]

export function Navbar() {
  const { location } = useRouterState()
  const currentPath = location.pathname

  return (
    <nav className="flex justify-center gap-1 border-b border-border bg-muted/50 px-4 py-3">
      {navItems.map((item) => {
        const isActive = currentPath === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "relative px-4 py-2 text-sm font-medium uppercase tracking-wide transition-all duration-200 rounded-md",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

import { Link } from "@tanstack/react-router"
import { Fragment } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Path segments that are real pages, so the breadcrumb can link them. */
const SEGMENT_ROUTES: Record<string, string> = {
  rankings: "/rankings",
  projects: "/projects",
  "about-me": "/about-me",
  admin: "/admin",
}

/**
 * A shell-style breadcrumb, e.g. ~/projects/real-talk. Every segment but the
 * last links back up when it's a real page.
 */
export function PathCrumb({ path }: { path: string }) {
  const segments = path.split("/").filter(Boolean)
  const linkClass =
    "-my-2 inline-block rounded-sm py-2 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
  return (
    <nav
      aria-label="Breadcrumb"
      className="font-mono text-xs font-medium text-secondary"
    >
      <Link to="/" className={linkClass}>
        ~
      </Link>
      {segments.map((segment, i) => {
        const route = SEGMENT_ROUTES[segment]
        const last = i === segments.length - 1
        return (
          <Fragment key={`${segment}-${i}`}>
            <span className="text-secondary/60">/</span>
            {route && !last ? (
              <Link to={route} className={linkClass}>
                {segment}
              </Link>
            ) : (
              <span aria-current={last ? "page" : undefined}>{segment}</span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

/**
 * A page's title block: breadcrumb, title, optional one-line intro, and an
 * optional actions slot. Always full width so the title never shifts between
 * pages; narrow pages constrain their body instead.
 */
export function PageHeader({
  path,
  title,
  description,
  actions,
  inlineActions = false,
  className,
}: {
  path: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Keep actions beside the title on phones too (for one small action). */
  inlineActions?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:border-b sm:border-border/70 sm:pb-6",
        inlineActions && "flex-row items-end justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <PathCrumb path={path} />
        <h1 className="mt-1.5 text-[1.75rem] leading-tight font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-prose text-[15px] leading-normal text-pretty text-muted-foreground sm:mt-2 sm:leading-relaxed md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2 max-md:[&:not(:has(>:not(.hidden)))]:hidden">
          {actions}
        </div>
      )}
    </header>
  )
}

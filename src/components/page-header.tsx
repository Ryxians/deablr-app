import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * A page's title block: a little shell-style path, the title, an optional
 * one-line intro, and an optional actions slot aligned to the right.
 */
export function PageHeader({
  path,
  title,
  description,
  actions,
  className,
}: {
  path: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <p className="mb-1.5 font-mono text-xs font-medium text-secondary">
          ~/{path}
        </p>
        <h1 className="text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  )
}

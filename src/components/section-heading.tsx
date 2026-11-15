import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * An in-page section title: mono heading underlined in the house pink, plus
 * an optional trailing slot for counts or actions.
 */
export function SectionHeading({
  children,
  action,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
  as?: "h2" | "h3"
}) {
  return (
    <div
      className={cn(
        "mb-4 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2",
        className
      )}
    >
      <Tag className="text-lg font-bold tracking-tight underline decoration-primary decoration-[3px] underline-offset-[7px] md:text-xl">
        {children}
      </Tag>
      {action}
    </div>
  )
}

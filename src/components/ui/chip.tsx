import { cva } from "class-variance-authority"
import type { VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-sm font-mono font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        primary: "bg-primary/15 text-primary ring-1 ring-primary/35 ring-inset",
        secondary:
          "bg-secondary/12 text-secondary ring-1 ring-secondary/35 ring-inset",
        accent: "bg-accent/12 text-accent ring-1 ring-accent/35 ring-inset",
        muted: "bg-well text-muted-foreground ring-1 ring-border ring-inset",
        sun: "bg-sun text-[oklch(0.25_0.06_80)] shadow-lift",
        solid: "bg-well/90 text-foreground shadow-lift",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[11px] leading-tight tracking-wide uppercase",
        sm: "px-2 py-0.5 text-xs",
      },
    },
    defaultVariants: { tone: "muted", size: "sm" },
  }
)

/** A small label for types, tags, and statuses. */
export function Chip({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return (
    <span className={cn(chipVariants({ tone, size }), className)} {...props} />
  )
}

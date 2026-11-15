import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * House button rules:
 * - One solid pink `default` per view, for the main action.
 * - `ghost` / `ghost-destructive` carry a hairline ring so they still read as
 *   tappable controls on touch screens; plain `ghost` drops it from md up.
 * - Below md every size is at least 40px tall.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md font-mono text-[13px] font-semibold whitespace-nowrap transition-[color,background-color,box-shadow,transform] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lift hover:brightness-105 active:translate-y-px active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground shadow-lift hover:brightness-105 active:translate-y-px active:shadow-none",
        destructive:
          "bg-destructive text-[oklch(0.2_0.05_25)] shadow-lift hover:brightness-105 active:translate-y-px active:shadow-none",
        outline:
          "border border-border bg-well/60 text-foreground hover:border-secondary/60 hover:bg-muted",
        ghost:
          "text-muted-foreground ring-1 ring-border/60 ring-inset hover:bg-muted hover:text-foreground md:ring-0",
        "ghost-destructive":
          "text-destructive ring-1 ring-destructive/40 ring-inset hover:bg-destructive/10",
        link: "text-secondary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 has-[>svg]:px-3.5",
        sm: "h-10 gap-1.5 px-3 text-xs has-[>svg]:px-2.5 md:h-8",
        lg: "h-12 px-6 text-sm has-[>svg]:px-5",
        icon: "size-10",
        "icon-sm": "size-11 md:size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

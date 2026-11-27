import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * A row action that stays focusable when unavailable: `unavailable` sets
 * aria-disabled (and dims it) instead of `disabled`, which would drop
 * keyboard focus to <body>. The click handler is dropped in that state.
 * `itemId` and `action` let the list refocus it after a row moves.
 */
export function ActionButton({
  itemId,
  action,
  unavailable,
  variant = "ghost",
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button> & {
  itemId: string
  action: string
  unavailable: boolean
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={variant}
      data-item={itemId}
      data-action={action}
      aria-disabled={unavailable || undefined}
      className={cn(
        "aria-disabled:cursor-default aria-disabled:opacity-50",
        className
      )}
      onClick={unavailable ? undefined : onClick}
      {...props}
    />
  )
}

import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-well px-3 py-1 text-base text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground/85 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "file:mr-3 file:inline-flex file:h-7 file:cursor-pointer file:rounded-sm file:border-0 file:bg-muted file:px-2.5 file:font-mono file:text-xs file:font-semibold file:text-foreground",
        "focus-visible:border-secondary focus-visible:ring-[3px] focus-visible:ring-ring/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }

import { useSelector } from "@tanstack/react-store"
import { cn } from "@/lib/utils"
import { store, toggleAnimations } from "@/stores/real-talk"

/** A labelled switch for Real Talk's card animations (remembered per browser). */
export function MotionToggle({ className }: { className?: string }) {
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={animationsEnabled}
      onClick={toggleAnimations}
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-2.5 rounded-full border border-border/70 py-1 pr-1.5 pl-3.5 font-mono text-xs font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      Animations
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          animationsEnabled
            ? "bg-secondary"
            : "bg-well ring-1 ring-border ring-inset"
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full transition-[left,background-color]",
            animationsEnabled
              ? "left-5 bg-secondary-foreground"
              : "left-1 bg-muted-foreground"
          )}
        />
      </span>
    </button>
  )
}

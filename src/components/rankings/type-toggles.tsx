import type { PropertyType } from "@/lib/rankings"
import { PROPERTY_TYPES, typeLabel } from "@/lib/rankings"
import { cn } from "@/lib/utils"

/** Multi-select pill toggles for Property Types (filters and the form). */
export function TypeToggles({
  selected,
  onToggle,
  idPrefix,
  className,
}: {
  selected: Array<PropertyType>
  onToggle: (type: PropertyType, on: boolean) => void
  idPrefix: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {PROPERTY_TYPES.map((type) => {
        const on = selected.includes(type)
        return (
          <button
            key={type}
            id={`${idPrefix}-${type}`}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(type, !on)}
            className="h-10 cursor-pointer rounded-full border border-border bg-well/50 px-3.5 font-mono text-xs font-semibold text-muted-foreground transition-colors outline-none hover:border-secondary/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:border-secondary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground md:h-8 md:px-3"
          >
            {typeLabel(type)}
          </button>
        )
      })}
    </div>
  )
}

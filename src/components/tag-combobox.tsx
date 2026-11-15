import { CheckIcon, ChevronsUpDownIcon, PlusIcon, XIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/** Normalizes a candidate tag: trimmed, lowercased, commas stripped. */
function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/,+/g, "")
}

/**
 * A shadcn combobox for picking multiple Tags. With `creatable`, a query
 * that matches no existing Tag can be defined as a new one.
 */
export function TagCombobox({
  options,
  selected,
  onChange,
  creatable = false,
  placeholder = "Select tags…",
  id,
  className,
}: {
  options: Array<string>
  selected: Array<string>
  onChange: (next: Array<string>) => void
  creatable?: boolean
  placeholder?: string
  id?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const normalizedQuery = normalizeTag(query)
  const queryExists = useMemo(
    () =>
      normalizedQuery.length > 0 &&
      options.some((o) => o.toLowerCase() === normalizedQuery),
    [options, normalizedQuery]
  )
  const showCreate = creatable && normalizedQuery.length > 0 && !queryExists

  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag]
    )
  }

  function createAndAdd() {
    if (!normalizedQuery || selected.includes(normalizedQuery)) return
    onChange([...selected, normalizedQuery])
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-10 w-full justify-between gap-2 bg-well px-3 py-1.5 font-normal hover:bg-well",
            className
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 rounded-sm bg-secondary/15 py-0.5 pr-0.5 pl-1.5 text-xs text-secondary ring-1 ring-secondary/35 ring-inset"
                >
                  {tag}
                  <span
                    role="button"
                    aria-label={`Remove ${tag}`}
                    className="cursor-pointer rounded-sm p-0.5 hover:bg-secondary/25"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(tag)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation()
                        toggle(tag)
                      }
                    }}
                  >
                    <XIcon className="size-3" />
                  </span>
                </span>
              ))
            )}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
      >
        <Command>
          <CommandInput
            placeholder={creatable ? "Search or create…" : "Search tags…"}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {creatable ? "Type to define a new tag." : "No tags found."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((tag) => (
                <CommandItem key={tag} value={tag} onSelect={() => toggle(tag)}>
                  <CheckIcon
                    className={cn(
                      "size-4",
                      selected.includes(tag) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tag}
                </CommandItem>
              ))}
              {showCreate && (
                <CommandItem
                  value={`create-${normalizedQuery}`}
                  onSelect={createAndAdd}
                >
                  <PlusIcon className="size-4" />
                  Create &quot;{normalizedQuery}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

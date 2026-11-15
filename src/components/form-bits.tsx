import type { FormEvent, ReactNode } from "react"
import { Label } from "@/components/ui/label"

/** A narrow card that holds a short form (login, signup, create user). */
export function FormCard({
  onSubmit,
  children,
}: {
  onSubmit: (e: FormEvent) => void
  children: ReactNode
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md space-y-4 rounded-xl border border-border/50 bg-card p-5 md:p-6"
    >
      {children}
    </form>
  )
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  )
}

/**
 * A short form with Penny keeping watch beside it (below it on phones), so
 * auth pages use the frame's width instead of leaving a dead column.
 */
export function PennyFormLayout({
  caption,
  children,
}: {
  caption: string
  children: ReactNode
}) {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-10">
      <div className="min-w-0">{children}</div>
      <aside className="flex items-center gap-4 rounded-xl border border-dashed border-border/70 p-4 lg:flex-col lg:border-0 lg:p-0">
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[oklch(0.94_0.03_230)] ring-4 ring-secondary/40 lg:size-48 lg:ring-8">
          <img
            src="/penny.svg"
            alt="Penny the dog"
            className="size-full scale-[1.15] mix-blend-multiply"
          />
        </span>
        <p className="font-mono text-sm text-muted-foreground lg:text-center">
          {caption}
        </p>
      </aside>
    </div>
  )
}

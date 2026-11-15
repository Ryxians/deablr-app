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
      className="max-w-md space-y-4 rounded-xl border border-border/80 bg-card p-5 md:p-6"
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

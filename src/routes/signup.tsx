import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FormCard,
  FormError,
  PennyFormLayout,
} from "@/components/form-bits"
import { PageHeader } from "@/components/page-header"
import { requestAccount } from "@/server/onboarding"

export const Route = createFileRoute("/signup")({
  component: SignupPage,
})

function SignupPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setPending(true)
    try {
      await requestAccount({ data: { username, password } })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <section>
        <PageHeader path="signup" title="Request Received" />
        <p>
          Your account is pending approval. You can log in once an Admin
          approves it.
        </p>
      </section>
    )
  }

  return (
    <section>
      <PageHeader path="signup" title="Request an Account" />
      <PennyFormLayout caption="Penny reviews every request personally.">
        <FormCard onSubmit={onSubmit}>
          <Field label="Username" htmlFor="signup-username">
            <Input
              id="signup-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password" htmlFor="signup-password">
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm password" htmlFor="signup-confirm">
            <Input
              id="signup-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Requesting…" : "Request account"}
          </Button>
        </FormCard>
      </PennyFormLayout>
    </section>
  )
}

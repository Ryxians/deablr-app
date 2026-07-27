import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      <section className="mb-6">
        <h2 className="mb-2 border-b border-border text-xl font-bold">
          Request Received
        </h2>
        <p>
          Your account is pending approval. You can log in once an Admin
          approves it.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="mb-2 border-b border-border text-xl font-bold">
        Request an Account
      </h2>
      <form onSubmit={onSubmit} className="max-w-sm space-y-4">
        <div className="space-y-1">
          <Label htmlFor="signup-username">Username</Label>
          <Input
            id="signup-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-confirm">Confirm password</Label>
          <Input
            id="signup-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Requesting…" : "Request account"}
        </Button>
      </form>
    </section>
  )
}

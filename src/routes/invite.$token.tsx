import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getInviteStatus, redeemInvite } from "@/server/invites"

export const Route = createFileRoute("/invite/$token")({
  loader: ({ params }) => getInviteStatus({ data: { token: params.token } }),
  component: InvitePage,
})

function InvitePage() {
  const { token } = Route.useParams()
  const invite = Route.useLoaderData()
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
      await redeemInvite({ data: { token, username, password } })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem invite")
    } finally {
      setPending(false)
    }
  }

  if (invite.status !== "valid" && !done) {
    const reason =
      invite.status === "used"
        ? "This invite link has already been used."
        : invite.status === "expired"
          ? "This invite link has expired."
          : "This invite link is not valid."
    return (
      <section className="mb-6">
        <h2 className="mb-2 border-b border-border text-xl font-bold">
          Invite Unavailable
        </h2>
        <p>{reason} Ask an Admin for a new one.</p>
      </section>
    )
  }

  if (done) {
    return (
      <section className="mb-6">
        <h2 className="mb-2 border-b border-border text-xl font-bold">
          Welcome, Denizen
        </h2>
        <p>
          Your account is ready. You can now{" "}
          <Link to="/admin" className="underline">
            log in
          </Link>
          .
        </p>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="mb-2 border-b border-border text-xl font-bold">
        You Have Been Invited
      </h2>
      <p className="mb-4">Pick a username and password to claim your account.</p>
      <form onSubmit={onSubmit} className="max-w-sm space-y-4">
        <div className="space-y-1">
          <Label htmlFor="invite-username">Username</Label>
          <Input
            id="invite-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invite-password">Password</Label>
          <Input
            id="invite-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invite-confirm">Confirm password</Label>
          <Input
            id="invite-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
    </section>
  )
}

import { Link, createFileRoute } from "@tanstack/react-router"
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
      <section>
        <PageHeader path="invite" title="Invite Unavailable" />
        <p>{reason} Ask an Admin for a new one.</p>
      </section>
    )
  }

  if (done) {
    return (
      <section>
        <PageHeader path="invite" title="Welcome, Denizen" />
        <p>
          Your account is ready. You can now{" "}
          <Link
            to="/admin"
            className="font-semibold text-secondary underline underline-offset-4"
          >
            log in
          </Link>
          .
        </p>
      </section>
    )
  }

  return (
    <section>
      <PageHeader path="invite" title="You Have Been Invited" />
      <p className="-mt-4 mb-6 text-muted-foreground">
        Pick a username and password to claim your account.
      </p>
      <PennyFormLayout caption="Someone vouched for you. Penny approves.">
        <FormCard onSubmit={onSubmit}>
          <Field label="Username" htmlFor="invite-username">
            <Input
              id="invite-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password" htmlFor="invite-password">
            <Input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm password" htmlFor="invite-confirm">
            <Input
              id="invite-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create account"}
          </Button>
        </FormCard>
      </PennyFormLayout>
    </section>
  )
}

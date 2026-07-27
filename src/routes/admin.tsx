import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { NotFound } from "@/components/NotFound"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"
import {
  createFirstAdmin,
  createUser,
  deleteUser,
  getSetupStatus,
  listUsers,
  resetUserPassword,
  setUserBanned,
  setUserRole,
} from "@/server/admin"
import { createInvite, listInvites, revokeInvite } from "@/server/invites"
import { getCurrentUser } from "@/server/session"

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const [setup, user] = await Promise.all([
      getSetupStatus(),
      getCurrentUser(),
    ])
    return { needsSetup: setup.needsSetup, user }
  },
  component: AdminPage,
})

function AdminPage() {
  const { needsSetup, user } = Route.useLoaderData()
  if (needsSetup) return <SetupForm />
  if (!user) return <LoginForm />
  if (user.role !== "admin") return <NotFound />
  return <Dashboard me={user} />
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 border-b border-border text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function SetupForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
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
      await createFirstAdmin({ data: { username, password } })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <Section title="First Run Setup">
        <p className="mb-4">
          No Users exist yet. This one-time form creates the first Admin.
        </p>
        <form onSubmit={onSubmit} className="max-w-sm space-y-4">
          <div className="space-y-1">
            <Label htmlFor="setup-username">Username</Label>
            <Input
              id="setup-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="setup-password">Password</Label>
            <Input
              id="setup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="setup-confirm">Confirm password</Label>
            <Input
              id="setup-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create Admin"}
          </Button>
        </form>
      </Section>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error: signInError } = await authClient.signIn.username({
      username,
      password,
    })
    setPending(false)
    if (signInError) {
      setError(
        signInError.code === "BANNED_USER"
          ? "Your account is pending approval."
          : "Invalid username or password.",
      )
      return
    }
    await router.invalidate()
  }

  return (
    <div>
      <Section title="Admin Login">
        <form onSubmit={onSubmit} className="max-w-sm space-y-4">
          <div className="space-y-1">
            <Label htmlFor="login-username">Username</Label>
            <Input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </Section>
    </div>
  )
}

type Role = "admin" | "denizen"

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role
  onChange: (role: Role) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)}>
      <SelectTrigger className="w-32" disabled={disabled}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="denizen">Denizen</SelectItem>
      </SelectContent>
    </Select>
  )
}

function Dashboard({ me }: { me: { id: string; username: string } }) {
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    await router.invalidate()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p>
          Henlo, <span className="font-bold">{me.username}</span>.
        </p>
        <Button variant="outline" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
      <UsersSection me={me} />
      <CreateUserSection />
      <InvitesSection />
    </div>
  )
}

function UsersSection({ me }: { me: { id: string } }) {
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: listUsers })
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed")
    }
  }

  return (
    <Section title="Users">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {users.isPending && <p>Loading…</p>}
      {users.data && (
        <ul className="space-y-2">
          {users.data.map((u) => {
            const isSelf = u.id === me.id
            const pendingApproval =
              u.banned && u.banReason === "Pending approval"
            return (
              <li
                key={u.id}
                className="flex flex-wrap items-center gap-2 border border-border p-2"
              >
                <span className="font-bold">{u.username}</span>
                {pendingApproval ? (
                  <span className="text-sm text-yellow-600">Pending</span>
                ) : u.banned ? (
                  <span className="text-sm text-red-600">Banned</span>
                ) : null}
                <span className="grow" />
                <RoleSelect
                  value={u.role === "admin" ? "admin" : "denizen"}
                  disabled={isSelf}
                  onChange={(role) =>
                    run(() => setUserRole({ data: { userId: u.id, role } }))
                  }
                />
                {u.banned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      run(() =>
                        setUserBanned({
                          data: { userId: u.id, banned: false },
                        }),
                      )
                    }
                  >
                    {pendingApproval ? "Approve" : "Unban"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSelf}
                    onClick={() =>
                      run(() =>
                        setUserBanned({ data: { userId: u.id, banned: true } }),
                      )
                    }
                  >
                    Ban
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newPassword = window.prompt(
                      `New password for ${u.username} (min 8 chars):`,
                    )
                    if (newPassword) {
                      void run(() =>
                        resetUserPassword({
                          data: { userId: u.id, newPassword },
                        }),
                      )
                    }
                  }}
                >
                  Reset password
                </Button>
                {!isSelf && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm(`Delete ${u.username}?`)) {
                        void run(() => deleteUser({ data: { userId: u.id } }))
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

function CreateUserSection() {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("denizen")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createUser({ data: { username, password, role } }),
    onSuccess: async () => {
      setMessage(`Created ${username}.`)
      setError(null)
      setUsername("")
      setPassword("")
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: (err) => {
      setMessage(null)
      setError(err instanceof Error ? err.message : "Could not create user")
    },
  })

  return (
    <Section title="Create User">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
        className="max-w-sm space-y-4"
      >
        <div className="space-y-1">
          <Label htmlFor="create-username">Username</Label>
          <Input
            id="create-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="create-password">Password</Label>
          <Input
            id="create-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Role</Label>
          <RoleSelect value={role} onChange={setRole} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create User"}
        </Button>
      </form>
    </Section>
  )
}

function InvitesSection() {
  const queryClient = useQueryClient()
  const invites = useQuery({
    queryKey: ["admin", "invites"],
    queryFn: listInvites,
  })
  const [role, setRole] = useState<Role>("denizen")
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: ["admin", "invites"] })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed")
    }
  }

  function inviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`
  }

  return (
    <Section title="Invite Links">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="mb-4 flex items-center gap-2">
        <RoleSelect value={role} onChange={setRole} />
        <Button
          size="sm"
          onClick={() => run(() => createInvite({ data: { role } }))}
        >
          Generate invite
        </Button>
      </div>
      {invites.data && invites.data.length === 0 && <p>No invites yet.</p>}
      {invites.data && (
        <ul className="space-y-2">
          {invites.data.map((inv) => {
            const used = !!inv.usedAt
            const expired = !used && inv.expiresAt < new Date()
            return (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-2 border border-border p-2 text-sm"
              >
                <code className="break-all">
                  {used || expired ? inv.token.slice(0, 8) + "…" : inviteUrl(inv.token)}
                </code>
                <span className="grow" />
                <span>{inv.role}</span>
                <span className="text-muted-foreground">
                  {used ? "Used" : expired ? "Expired" : "Active"}
                </span>
                {!used && !expired && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(inviteUrl(inv.token))
                    }
                  >
                    Copy
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    run(() => revokeInvite({ data: { inviteId: inv.id } }))
                  }
                >
                  Revoke
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

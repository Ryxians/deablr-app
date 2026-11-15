import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import {
  Ban,
  Copy,
  KeyRound,
  Link2,
  LogOut,
  Trash2,
  UserPlus,
} from "lucide-react"
import { NotFound } from "@/components/NotFound"
import { PageHeader } from "@/components/page-header"
import {
  Field,
  FormCard,
  FormError,
  PennyFormLayout,
} from "@/components/form-bits"
import { SectionHeading } from "@/components/section-heading"
import { Chip } from "@/components/ui/chip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
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
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10 last:mb-0">
      <SectionHeading>{title}</SectionHeading>
      {description && (
        <p className="-mt-1 mb-4 text-[15px] text-muted-foreground">
          {description}
        </p>
      )}
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
      <PageHeader
        path="admin"
        title="First Run Setup"
        description="No Users exist yet. This one-time form creates the first Admin."
      />
      <PennyFormLayout caption="Penny will remember who set this place up.">
        <FormCard onSubmit={onSubmit}>
          <Field label="Username" htmlFor="setup-username">
            <Input
              id="setup-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password" htmlFor="setup-password">
            <Input
              id="setup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm password" htmlFor="setup-confirm">
            <Input
              id="setup-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create Admin"}
          </Button>
        </FormCard>
      </PennyFormLayout>
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
          : "Invalid username or password."
      )
      return
    }
    await router.invalidate()
  }

  return (
    <div>
      <PageHeader
        path="admin"
        title="Log in"
        description="Admins and Denizens only."
      />
      <PennyFormLayout caption="Penny is watching.">
        <FormCard onSubmit={onSubmit}>
          <Field label="Username" htmlFor="login-username">
            <Input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Logging in…" : "Log in"}
          </Button>
        </FormCard>
      </PennyFormLayout>
    </div>
  )
}

type Role = "admin" | "denizen"

function RoleSelect({
  value,
  onChange,
  disabled,
  className = "w-full min-w-28",
}: {
  value: Role
  onChange: (role: Role) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)}>
      <SelectTrigger className={className} disabled={disabled}>
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
      <PageHeader
        path="admin"
        title="Dashboard"
        description={
          <>
            Henlo,{" "}
            <span className="font-bold text-foreground">{me.username}</span>.
          </>
        }
        actions={
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut />
            Sign out
          </Button>
        }
      />
      <UsersSection me={me} />
      <div className="grid gap-x-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CreateUserSection />
        <InvitesSection />
      </div>
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
      {error && (
        <div className="mb-3">
          <FormError>{error}</FormError>
        </div>
      )}
      {users.isPending && (
        <p className="font-mono text-sm text-muted-foreground">Loading…</p>
      )}
      {users.data && (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/50 bg-card">
          {users.data.map((u) => {
            const isSelf = u.id === me.id
            const pendingApproval =
              u.banned && u.banReason === "Pending approval"
            return (
              <li
                key={u.id}
                className="grid items-center gap-x-4 gap-y-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_auto]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-bold">{u.username}</span>
                  {isSelf && (
                    <Chip tone="secondary" size="xs">
                      You
                    </Chip>
                  )}
                  {pendingApproval ? (
                    <Chip tone="sun" size="xs">
                      Pending
                    </Chip>
                  ) : u.banned ? (
                    <Chip tone="muted" size="xs" className="text-destructive">
                      Banned
                    </Chip>
                  ) : null}
                </span>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-[8rem_7rem_10rem_6.5rem]">
                  <RoleSelect
                    value={u.role === "admin" ? "admin" : "denizen"}
                    disabled={isSelf}
                    onChange={(role) =>
                      run(() => setUserRole({ data: { userId: u.id, role } }))
                    }
                  />
                  {u.banned ? (
                    <Button
                      variant={pendingApproval ? "default" : "outline"}
                      onClick={() =>
                        run(() =>
                          setUserBanned({
                            data: { userId: u.id, banned: false },
                          })
                        )
                      }
                    >
                      {pendingApproval ? "Approve" : "Unban"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={isSelf}
                      onClick={() => {
                        if (window.confirm(`Ban ${u.username}?`)) {
                          void run(() =>
                            setUserBanned({
                              data: { userId: u.id, banned: true },
                            })
                          )
                        }
                      }}
                    >
                      <Ban />
                      Ban
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newPassword = window.prompt(
                        `New password for ${u.username} (min 8 chars):`
                      )
                      if (newPassword) {
                        void run(() =>
                          resetUserPassword({
                            data: { userId: u.id, newPassword },
                          })
                        )
                      }
                    }}
                  >
                    <KeyRound />
                    Reset password
                  </Button>
                  {isSelf ? (
                    <span aria-hidden className="hidden lg:block" />
                  ) : (
                    <Button
                      variant="outline"
                      className="text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`Delete ${u.username}?`)) {
                          void run(() => deleteUser({ data: { userId: u.id } }))
                        }
                      }}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  )}
                </div>
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
      <FormCard
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
      >
        <Field label="Username" htmlFor="create-username">
          <Input
            id="create-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" htmlFor="create-password">
          <Input
            id="create-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field label="Role">
          <RoleSelect value={role} onChange={setRole} />
        </Field>
        {error && <FormError>{error}</FormError>}
        {message && (
          <p className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-sm text-accent">
            {message}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          <UserPlus />
          {mutation.isPending ? "Creating…" : "Create user"}
        </Button>
      </FormCard>
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
    <Section
      title="Invite Links"
      description="One-use links that let someone claim an account."
    >
      {error && (
        <div className="mb-3">
          <FormError>{error}</FormError>
        </div>
      )}
      <div className="mb-4 flex items-center gap-2">
        <RoleSelect value={role} onChange={setRole} className="w-32" />
        <Button onClick={() => run(() => createInvite({ data: { role } }))}>
          <Link2 />
          Generate invite
        </Button>
      </div>
      {invites.data && invites.data.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-8 text-center font-mono text-sm text-muted-foreground">
          No invites yet.
        </p>
      )}
      {invites.data && invites.data.length > 0 && (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/50 bg-card">
          {invites.data.map((inv) => {
            const used = !!inv.usedAt
            const expired = !used && inv.expiresAt < new Date()
            const active = !used && !expired
            return (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm"
              >
                <code
                  className={cn(
                    "min-w-0 flex-1 basis-60 font-mono text-xs break-all",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {active ? inviteUrl(inv.token) : inv.token.slice(0, 8) + "…"}
                </code>
                <Chip tone="muted" size="xs">
                  {inv.role}
                </Chip>
                <Chip tone={active ? "accent" : "muted"} size="xs">
                  {used ? "Used" : expired ? "Expired" : "Active"}
                </Chip>
                <div className="flex items-center gap-1.5">
                  {active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard.writeText(inviteUrl(inv.token))
                      }
                    >
                      <Copy />
                      Copy
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost-destructive"
                    onClick={() =>
                      run(() => revokeInvite({ data: { inviteId: inv.id } }))
                    }
                  >
                    Revoke
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

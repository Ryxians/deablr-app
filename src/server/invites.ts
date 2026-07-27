import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { requireAdmin } from "./helpers"
import { syntheticEmail } from "./utils"
import { db } from "@/db"
import { invite, user } from "@/db/schema"
import { auth } from "@/lib/auth"

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function generateToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

export const listInvites = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdmin()
    return db.select().from(invite)
  },
)

export const createInvite = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ role: z.enum(["admin", "denizen"]).default("denizen") }),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin()
    const [created] = await db
      .insert(invite)
      .values({
        id: crypto.randomUUID(),
        token: generateToken(),
        role: data.role,
        createdById: me.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      })
      .returning()
    return created
  },
)

export const revokeInvite = createServerFn({ method: "POST" })
  .inputValidator(z.object({ inviteId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    await db.delete(invite).where(eq(invite.id, data.inviteId))
  })

type InviteStatus =
  | { status: "valid" }
  | { status: "used" | "expired" | "invalid" }

async function lookupInvite(token: string): Promise<{
  row: typeof invite.$inferSelect | null
  status: InviteStatus
}> {
  const rows = await db
    .select()
    .from(invite)
    .where(eq(invite.token, token))
    .limit(1)
  const row = rows.at(0) ?? null
  if (!row) return { row: null, status: { status: "invalid" } }
  if (row.usedAt) return { row, status: { status: "used" } }
  if (row.expiresAt < new Date()) return { row, status: { status: "expired" } }
  return { row, status: { status: "valid" } }
}

/** Public: lets /invite/<token> explain itself before asking for credentials. */
export const getInviteStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }): Promise<InviteStatus> => {
    const { status } = await lookupInvite(data.token)
    return status
  })

/** Public: creates an active User from a valid invite token. */
export const redeemInvite = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string(),
      username: z
        .string()
        .min(3)
        .max(30)
        .regex(
          /^[a-zA-Z0-9_.]+$/,
          "Letters, numbers, underscores and dots only",
        ),
      password: z.string().min(8, "At least 8 characters"),
    }),
  )
  .handler(async ({ data }) => {
    const { row, status } = await lookupInvite(data.token)
    if (!row || status.status !== "valid") {
      throw new Error("This invite link is no longer valid")
    }
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: syntheticEmail(data.username),
          password: data.password,
          username: data.username,
          name: data.username,
        },
      })
      if (row.role !== "denizen") {
        await db
          .update(user)
          .set({ role: row.role })
          .where(eq(user.id, result.user.id))
      }
    } catch {
      throw new Error(`Could not create "${data.username}" — is it taken?`)
    }
    await db
      .update(invite)
      .set({ usedAt: new Date() })
      .where(eq(invite.id, row.id))
  })

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { count, eq } from "drizzle-orm"
import { z } from "zod"
import { requireAdmin } from "./helpers"
import { syntheticEmail } from "./utils"
import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"

const credentialsSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, underscores and dots only"),
  password: z.string().min(8, "At least 8 characters"),
})

/** Public: tells /admin whether to show the one-time first-run setup form. */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const [row] = await db.select({ value: count() }).from(user)
    return { needsSetup: row.value === 0 }
  },
)

/** Public, but only functional while no Users exist (first-run setup). */
export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator(credentialsSchema)
  .handler(async ({ data }) => {
    const [row] = await db.select({ value: count() }).from(user)
    if (row.value !== 0) {
      throw new Error("Setup has already been completed")
    }
    const result = await auth.api.signUpEmail({
      body: {
        email: syntheticEmail(data.username),
        password: data.password,
        username: data.username,
        name: data.username,
      },
    })
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, result.user.id))
  })

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin()
  return db
    .select({
      id: user.id,
      username: user.username,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
})

export const createUser = createServerFn({ method: "POST" })
  .inputValidator(
    credentialsSchema.extend({
      role: z.enum(["admin", "denizen"]).default("denizen"),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: syntheticEmail(data.username),
          password: data.password,
          username: data.username,
          name: data.username,
        },
      })
      if (data.role !== "denizen") {
        await db
          .update(user)
          .set({ role: data.role })
          .where(eq(user.id, result.user.id))
      }
    } catch {
      throw new Error(`Could not create "${data.username}" — is it taken?`)
    }
  })

export const setUserRole = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
      role: z.enum(["admin", "denizen"]),
    }),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin()
    if (data.userId === me.id) {
      throw new Error("You cannot change your own role")
    }
    await db.update(user).set({ role: data.role }).where(eq(user.id, data.userId))
  })

export const setUserBanned = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string(), banned: z.boolean() }))
  .handler(async ({ data }) => {
    const me = await requireAdmin()
    if (data.userId === me.id) {
      throw new Error("You cannot ban yourself")
    }
    const headers = getRequestHeaders()
    if (data.banned) {
      await auth.api.banUser({ body: { userId: data.userId }, headers })
    } else {
      await auth.api.unbanUser({ body: { userId: data.userId }, headers })
    }
  })

export const resetUserPassword = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
      newPassword: z.string().min(8, "At least 8 characters"),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    await auth.api.setUserPassword({
      body: { userId: data.userId, newPassword: data.newPassword },
      headers: getRequestHeaders(),
    })
  })

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const me = await requireAdmin()
    if (data.userId === me.id) {
      throw new Error("You cannot delete yourself")
    }
    await auth.api.removeUser({
      body: { userId: data.userId },
      headers: getRequestHeaders(),
    })
  })

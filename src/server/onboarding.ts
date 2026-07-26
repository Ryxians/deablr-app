import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { syntheticEmail } from "./utils"
import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"

/**
 * Open signup: creates a pending User (banned until an Admin approves them
 * from the /admin dashboard). Login is blocked while pending.
 */
export const requestAccount = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
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
    let userId: string
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: syntheticEmail(data.username),
          password: data.password,
          username: data.username,
          name: data.username,
        },
      })
      userId = result.user.id
    } catch {
      throw new Error(`Could not create "${data.username}" — is it taken?`)
    }
    await db
      .update(user)
      .set({ banned: true, banReason: "Pending approval" })
      .where(eq(user.id, userId))
  })

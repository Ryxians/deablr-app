import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin as adminPlugin, username } from "better-auth/plugins"
import { ac, roles } from "./permissions"
import { db } from "@/db"
import * as schema from "@/db/schema"

/**
 * The site sends no email. Users sign in with username + password; emails
 * stored on accounts are synthetic (`<username>@user.deablr.invalid`).
 */
const isProd = process.env.NODE_ENV === "production"

export const auth = betterAuth({
  appName: "Deablr",
  basePath: "/api/auth",
  // No baseURL: better-auth reads BETTER_AUTH_URL from the env on its own,
  // and otherwise derives the origin from each incoming request — always
  // correct for this same-origin app (the client uses window.location).
  // Dev fallback only; production must set BETTER_AUTH_SECRET (better-auth
  // refuses to boot with the default secret there).
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (isProd ? undefined : "deablr-dev-only-secret-7f3a9c1e52d84b06"),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  // All sign-up flows are server-orchestrated (first-run setup, invites,
  // open signup); Users log in explicitly afterwards.
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [
    username(),
    adminPlugin({
      ac,
      roles,
      defaultRole: "denizen",
      adminRoles: ["admin"],
    }),
  ],
})

export type Session = typeof auth.$Infer.Session

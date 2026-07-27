import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"

/**
 * Server-only helpers. Never import this file from a module that also exports
 * createServerFn definitions — exported helpers survive client dead-code
 * elimination and would leak the auth/DB graph into the browser bundle.
 */
export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })
  return session?.user ?? null
}

export async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden")
  }
  return user
}

import { createServerFn } from "@tanstack/react-start"
import { getSessionUser } from "./helpers"

/** Public: the currently signed-in User, or null. */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getSessionUser()
    if (!user) return null
    return {
      id: user.id,
      username: user.username ?? user.name,
      role: user.role ?? "denizen",
    }
  },
)

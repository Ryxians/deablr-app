import { createAuthClient } from "better-auth/react"
import { adminClient, usernameClient } from "better-auth/client/plugins"
import { ac, roles } from "./permissions"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [usernameClient(), adminClient({ ac, roles })],
})

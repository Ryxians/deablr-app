import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
} from "better-auth/plugins/admin/access"

/**
 * Global permission statements. New projects add their own resource here
 * (e.g. `question: ["submit"]`) rather than introducing new roles.
 */
const statement = {
  ...defaultStatements,
  content: ["submit", "moderate"],
  review: ["manage"],
} as const

export const ac = createAccessControl(statement)

export const admin = ac.newRole({
  ...adminAc.statements,
  content: ["submit", "moderate"],
  review: ["manage"],
})

export const denizen = ac.newRole({
  content: ["submit"],
})

export const roles = { admin, denizen } as const

export type RoleName = keyof typeof roles

import { definePlugin } from "nitro"
import { runMigrations } from "../../src/db"

/**
 * Applies pending drizzle migrations at server boot, before requests are
 * served. Idempotent — safe on every start.
 */
export default definePlugin(() => {
  runMigrations()
})

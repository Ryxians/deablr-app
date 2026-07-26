import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import * as schema from "./schema"

const dbPath =
  process.env.DB_PATH ??
  (process.env.NODE_ENV === "production"
    ? "/app/data/deablr.db"
    : "data/deablr.db")

if (dbPath !== ":memory:") {
  mkdirSync(dirname(dbPath), { recursive: true })
}

const sqlite = new Database(dbPath, { create: true })
sqlite.run("PRAGMA journal_mode = WAL")
sqlite.run("PRAGMA foreign_keys = ON")

export const db = drizzle(sqlite, { schema })

/**
 * Applies pending migrations. Called once at server boot by the nitro plugin
 * (server/plugins/migrate.ts). Idempotent.
 */
export function runMigrations() {
  migrate(db, {
    migrationsFolder: process.env.MIGRATIONS_FOLDER ?? "drizzle",
  })
}

# SQLite in a Docker volume with runtime migrations

Status: accepted

The site is a single Bun container (TanStack Start + Nitro) deployed via Dokploy, and its minor projects need persistence. We decided to use a single SQLite file in a named Docker volume (mounted at `/app/data`, DB at `/app/data/deablr.db`, declared in a repo `docker-compose.yml`), queried through Drizzle ORM over the `bun:sqlite` driver, with migrations applied in-process at server boot via Drizzle's programmatic `migrate()`. Bun runs the app in both dev and production.

## Considered Options

- **Postgres** — rejected: operational overhead (second service, credentials, backups) for a ~10-user personal site.
- **Entrypoint-script migrations** (`drizzle-kit migrate` before server start) — rejected: requires drizzle-kit and migration files wired into the runner image; boot-time in-process migration makes a forgotten migration impossible.
- **better-sqlite3** — rejected: native module; `bun:sqlite` is zero-dependency since Bun is the runtime everywhere.

## Consequences

- Single-writer SQLite means the app can only ever run as one container; acceptable for this site.
- Scripts that execute server code must force the Bun runtime (`bun --bun vite dev` in package.json): plain `vite dev` under Node fails on `bun:sqlite`. Do not "simplify" the dev script back to plain `vite dev`.
- Migrations must ship inside the `.output` bundle as Nitro assets so boot-time `migrate()` can read them.
- No automated backups yet: the DB is one file in the volume; revisit (e.g. Litestream) when real content (blog, reviews) exists.

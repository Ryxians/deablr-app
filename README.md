# Deablr

A personal website hosting a collection of minor projects, including the social question game Real Talk. See `CONTEXT.md` for domain language and `docs/adr/` for architectural decisions.

## Development

Requires [Bun](https://bun.sh).

```bash
bun install
bun dev
```

The app runs at http://localhost:3000. On first boot, SQLite migrations apply automatically and `/admin` shows a one-time setup form to create the first Admin. No environment variables are needed for local development; you may see a harmless `[better-auth] Base URL is not set` warning (see below).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Production | Signs sessions. Generate with `openssl rand -base64 32`. Dev uses a built-in fallback; better-auth refuses to boot in production without it. |
| `BETTER_AUTH_URL` | No | Public origin of the site (e.g. `https://deablr.example.com`). When unset, better-auth derives the origin from each incoming request, trusting `X-Forwarded-*` proxy headers by default — so it works behind Traefik with no extra config — and logs a startup warning. Set it to pin the origin explicitly and silence the warning. |
| `DB_PATH` | No | SQLite file location. Defaults to `data/deablr.db`, which resolves to `/app/data/deablr.db` in the Docker container (`WORKDIR /app`, volume at `/app/data`). |
| `MIGRATIONS_FOLDER` | No | Location of the Drizzle migration files. Defaults to `drizzle`. |

## Production

Deployed via Dokploy as a single container from `docker-compose.yml`; the SQLite database lives in the `deablr-data` volume. The compose file publishes no ports and declares no networks — add the domain in Dokploy's **Domains** tab and it injects the Traefik labels and network attachment at deploy time. Set `BETTER_AUTH_SECRET` (and optionally `BETTER_AUTH_URL`) in Dokploy's environment editor; variables there are written to a `.env` next to the compose file and passed through to the container.

## Adding components

This project uses shadcn/ui. To add components, run:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

# syntax=docker/dockerfile:1

FROM oven/bun:1.3.13 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY scripts/copy-ffmpeg-core.js ./scripts/copy-ffmpeg-core.js
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.3.13 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
# Migration SQL files are read from disk at server boot (see server/plugins/migrate.ts)
COPY --from=builder /app/drizzle ./drizzle
# sharp's JS is bundled into .output, but its native binaries are not traced.
# Without them, sharp's import-time native load fails inside a circular SSR
# chunk and surfaces as "Cannot access '<fn>_handler' before initialization".
COPY --from=builder /app/node_modules/@img ./.output/server/node_modules/@img

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]

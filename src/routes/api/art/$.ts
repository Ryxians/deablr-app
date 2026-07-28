import { readFile } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import { createFileRoute } from "@tanstack/react-router"

const ART_DIR = join(dirname(process.env.DB_PATH ?? "data/deablr.db"), "art")

/**
 * Serves processed 2:3 posters from the data volume. Filenames are random
 * UUIDs generated at upload time, so responses are immutable and cacheable.
 */
export const Route = createFileRoute("/api/art/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const filename = basename(url.pathname.replace("/api/art/", ""))
        if (!/^[\w-]+\.jpg$/.test(filename)) {
          return new Response("Not found", { status: 404 })
        }
        try {
          const bytes = await readFile(join(ART_DIR, filename))
          return new Response(new Uint8Array(bytes), {
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          })
        } catch {
          return new Response("Not found", { status: 404 })
        }
      },
    },
  },
})

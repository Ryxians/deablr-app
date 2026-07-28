# Property Art stored as uploaded files in the data volume

Rankings reviews display poster art for each Property. We decided Admins upload art directly (multipart), and the server stores the files in the existing data volume (`/app/data`, alongside SQLite) and serves them from there.

This is the app's first file-upload handling. Alternatives considered: hotlinking external URLs (images rot, hosts block hotlinks, visitor referrers leak), pasting a URL for the server to fetch-and-store (no multipart, but art without a URL is impossible), committing posters to `public/` (every review would need a commit and redeploy), and blobs in SQLite (bloats the single-file database; serving still needs a route). Direct upload to the already-persisted volume is the most flexible and keeps backups as "copy the data directory".

## Consequences

- Uploads are center-cropped/resized to a canonical 2:3 poster at upload time, so the server needs an image-processing step and only the processed poster is kept.
- sharp's JS is bundled into `.output` by nitro, but its native binaries (`node_modules/@img`) are not traced — the Dockerfile copies them into the runner explicitly. Without them the server boots but any route touching the rankings chunk 500s (sharp's import-time native load fails inside a circular SSR chunk pair, surfacing as a misleading "Cannot access … before initialization" TDZ error). The same trap applies to any future native dependency.

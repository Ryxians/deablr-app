import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const sourceDir = join(root, "node_modules", "@ffmpeg", "core", "dist", "esm")
const targetDir = join(root, "public", "ffmpeg")

const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"]

mkdirSync(targetDir, { recursive: true })

for (const file of files) {
  copyFileSync(join(sourceDir, file), join(targetDir, file))
}

console.log("Copied ffmpeg core files to public/ffmpeg")

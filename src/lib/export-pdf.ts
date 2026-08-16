import type { RankedReview } from "@/server/rankings"

/**
 * Loads an image URL into a downscaled JPEG data URL. Posters are stored at
 * 600px wide; shrinking to the cell's render size keeps the PDF small.
 */
async function loadPoster(url: string, targetWidthPx: number): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${url}`))
    image.src = url
  })
  const scale = Math.min(1, targetWidthPx / img.naturalWidth)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is unavailable")
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.85)
}

/**
 * Exports the given Reviews as a single-page PDF: every Property's artwork
 * in one grid, scaled so the whole grid fits on one A4 page. Posters are
 * always 2:3, so cells are uniform. Client-side only.
 */
export async function exportRankingsPdf(
  reviews: Array<RankedReview>
): Promise<void> {
  if (reviews.length === 0) return
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 6
  const gap = 2

  // Cell height is 1.5x its width (2:3 posters). Pick the column count that
  // maximizes the cell width while keeping the grid on one page.
  let cols = 1
  let cellW = 0
  for (let c = 1; c <= reviews.length; c++) {
    const rows = Math.ceil(reviews.length / c)
    const byWidth = (pageW - 2 * margin - (c - 1) * gap) / c
    const byHeight = (pageH - 2 * margin - (rows - 1) * gap) / rows / 1.5
    const w = Math.min(byWidth, byHeight)
    if (w > cellW) {
      cellW = w
      cols = c
    }
  }
  const rows = Math.ceil(reviews.length / cols)
  const cellH = cellW * 1.5
  const gridW = cols * cellW + (cols - 1) * gap
  const gridH = rows * cellH + (rows - 1) * gap
  const x0 = (pageW - gridW) / 2
  const y0 = (pageH - gridH) / 2

  // ~150 dpi at the cell's printed size: 1mm ≈ 6px.
  const posters = await Promise.all(
    reviews.map((r) => loadPoster(r.artUrl, Math.ceil(cellW * 6)))
  )
  posters.forEach((dataUrl, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    doc.addImage(
      dataUrl,
      "JPEG",
      x0 + col * (cellW + gap),
      y0 + row * (cellH + gap),
      cellW,
      cellH
    )
  })
  doc.save("rankings.pdf")
}

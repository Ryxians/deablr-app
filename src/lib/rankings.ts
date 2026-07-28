/**
 * Shared Rankings domain logic. Client-safe: no server-only imports.
 */

export const PROPERTY_TYPES = [
  "franchise",
  "show",
  "movie",
  "game",
  "book",
  "documentary",
  "video",
] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]

export function typeLabel(type: PropertyType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * The Metrics a Review can score on. New Metrics are added programmatically:
 * append an entry here and the board, form, and filters pick it up — the
 * database stores Metric keys as plain rows and needs no schema change.
 */
export const METRICS = [
  { key: "fun", label: "Fun" },
  { key: "art", label: "Art" },
] as const

export type MetricKey = (typeof METRICS)[number]["key"]

/** A Review's defined Scores by Metric, in integer milliunits. */
export type ScoreMap = Partial<Record<MetricKey, number>>

/** Scores are integer milliunits: 8.501 is stored as 8501. */
export const MAX_SCORE_MILLI = 10_000
/** Reviews scoring 9 or higher on every defined Metric display PEAK. */
export const PEAK_THRESHOLD_MILLI = 9_000

/**
 * Parses a user-entered score ("8.5", "-3", "8.501") into milliunits.
 * Returns null when the input is not a number with at most 3 decimal places
 * or exceeds the maximum of 10.
 */
export function parseScore(input: string): number | null {
  const trimmed = input.trim()
  const match = /^(-?)(\d+)(?:\.(\d{1,3}))?$/.exec(trimmed)
  if (!match) return null
  const [, sign, intPart, fracPart = ""] = match
  const milli =
    Number(intPart) * 1000 + Number(fracPart.padEnd(3, "0") || "0")
  const score = sign === "-" ? -milli : milli
  if (score > MAX_SCORE_MILLI) return null
  return score
}

/** Formats milliunits for display, trimming trailing zeros: 8500 → "8.5". */
export function formatScore(milli: number): string {
  return (milli / 1000).toString()
}

/** The mean of a Review's defined Scores, in (fractional) milliunits. */
export function averageScore(scores: ScoreMap): number {
  const values = Object.values(scores)
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Formats an Average for display: up to 2 decimals, zeros trimmed. */
export function formatAverage(milli: number): string {
  const rounded = Math.round(milli / 10) / 100
  return rounded.toString()
}

/** PEAK applies when every defined Metric scores 9 or higher. */
export function isPeak(scores: ScoreMap): boolean {
  return Object.values(scores).every((v) => v >= PEAK_THRESHOLD_MILLI)
}

/** Score Bands: 10 alone, one band per integer floor 9–0, negatives together. */
export type BandKey = number | "poop"

export function bandForScore(milli: number): BandKey {
  if (milli < 0) return "poop"
  return Math.min(10, Math.floor(milli / 1000))
}

export function bandLabel(key: BandKey): string {
  return key === "poop" ? "Certified Poop" : String(key)
}

/** Band display order, best first. Reverse for worst-first ordering. */
export const BANDS_BEST_FIRST: Array<BandKey> = [
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, "poop",
]

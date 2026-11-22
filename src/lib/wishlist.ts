/**
 * Shared Wishlist domain logic. Client-safe: no server-only imports.
 */

export const MAX_QUANTITY = 9999
/** $1,000,000 — keeps Unit Cost × Quantity well inside safe integers. */
export const MAX_COST_CENTS = 100_000_000
export const MAX_NAME_LENGTH = 200
export const MAX_LINKS = 20
export const MAX_LINK_LENGTH = 2000

/**
 * Parses a user-entered unit cost ("12", "12.5", ".99", "$1,299.99") into
 * integer cents. Commas must be thousands separators. Returns null unless
 * the input is a non-negative amount with at most 2 decimal places and no
 * more than MAX_COST_CENTS.
 */
export function parseCost(input: string): number | null {
  const trimmed = input.trim().replace(/^\$/, "")
  const match = /^(\d{1,3}(?:,\d{3})+|\d*)(?:\.(\d{0,2}))?$/.exec(trimmed)
  if (!match) return null
  const [, dollars, cents = ""] = match
  if (dollars === "" && cents === "") return null
  const total =
    Number(dollars.replace(/,/g, "") || "0") * 100 +
    Number(cents.padEnd(2, "0") || "0")
  return total <= MAX_COST_CENTS ? total : null
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

/** Formats integer cents for display: 129999 → "$1,299.99". */
export function formatCost(cents: number): string {
  return currency.format(cents / 100)
}

/** Formats cents back into an editable input value: 129999 → "1299.99". */
export function costInputValue(cents: number | null): string {
  if (cents === null) return ""
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

/**
 * Normalizes a purchase link: trimmed, `https://` added when no `scheme://`
 * is given (so `shop.test:8080/x` works). Returns null unless the result is
 * a valid http(s) URL without embedded credentials.
 */
export function normalizeLink(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > MAX_LINK_LENGTH) return null
  // A mistyped scheme ("http:/x.com") would otherwise become https://http/…
  if (/^https?:(?!\/\/)/i.test(trimmed)) return null
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

/** A short display label for a purchase link: its hostname sans "www.". */
export function linkLabel(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "")
  } catch {
    return link
  }
}

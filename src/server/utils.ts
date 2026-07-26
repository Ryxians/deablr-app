/**
 * The site sends no email; accounts store a synthetic address derived from
 * the username because better-auth's schema requires one.
 */
export function syntheticEmail(username: string) {
  return `${username.toLowerCase()}@user.deablr.invalid`
}

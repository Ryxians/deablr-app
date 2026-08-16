import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

// ---------------------------------------------------------------------------
// better-auth tables (core + username + admin plugins). Kept in sync with the
// installed better-auth version; mirror of `@better-auth/cli generate` output.
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  // username plugin
  username: text("username").unique(),
  displayUsername: text("display_username"),
  // admin plugin
  role: text("role"),
  banned: integer("banned", { mode: "boolean" }).$defaultFn(() => false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // admin plugin
  impersonatedBy: text("impersonated_by"),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
})

// ---------------------------------------------------------------------------
// Project tables
// ---------------------------------------------------------------------------

/**
 * A show, movie, game, book, or other work that can appear in the Rankings.
 * `types` holds one or more Property Types (franchise, show, movie, game,
 * book, documentary, video); `tags` holds normalized lowercase labels.
 * `artPath` points at the processed 2:3 poster on disk (data/art/).
 * `incomplete` marks a Property the Admin has not finished (still watching,
 * reading, playing); the Rankings board can filter on it.
 */
export const property = sqliteTable("property", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  types: text("types", { mode: "json" }).$type<string[]>().notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
  artPath: text("art_path").notNull(),
  incomplete: integer("incomplete", { mode: "boolean" })
    .default(false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

/**
 * An Admin's scored judgment of a Property (strictly 1:1). Its Scores live in
 * `review_score`, one row per Metric the Review is rated on.
 */
export const review = sqliteTable("review", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .unique()
    .references(() => property.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

/**
 * One Score a Review gives on one Metric (fun, art, …). `score` is stored as
 * integer milliunits (8.501 → 8501) so uniqueness and ordering are exact;
 * divide by 1000 for display. 10000 (a 10) is the maximum. Scores are unique
 * per Metric across all Reviews. A Review with no row for a Metric is
 * undefined on that Metric; every Review has at least one row here.
 * New Metrics need no schema change — only new `metric` values.
 */
export const reviewScore = sqliteTable(
  "review_score",
  {
    reviewId: text("review_id")
      .notNull()
      .references(() => review.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(),
    score: integer("score").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.reviewId, t.metric] }),
    unique().on(t.metric, t.score),
  ],
)


/**
 * Single-use invite links generated by an Admin from the /admin dashboard.
 * Redeemed at /invite/<token> to create an active User with the given role.
 */
export const invite = sqliteTable("invite", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("denizen"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

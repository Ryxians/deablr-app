import { serve } from "bun";
import index from "#/index.html";
import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { WordleRoutes } from "./wordle.ts";

const app = new Hono()
  .basePath("/api")
  .get("/hc", (c) => c.text("Hello", 200))
  .route("/wordle", WordleRoutes);
export type ServerRoutes = typeof app;
showRoutes(app);

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    "/api/*": app.fetch,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

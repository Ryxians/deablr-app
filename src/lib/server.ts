import { hc } from "hono/client";
import type { ServerRoutes } from "../../server";

export const client = hc<ServerRoutes>(`${window.location.origin}`).api;

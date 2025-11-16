import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { rootRoute } from "@/components/Layout.tsx";
import { indexRoute } from "@/routes/AboutMe.tsx";
import { notFoundRoute } from "@/routes/NotFound.tsx";

const routeTree = rootRoute.addChildren([indexRoute, notFoundRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(rootElement));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(rootElement).render(app);
}

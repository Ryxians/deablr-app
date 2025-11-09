/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "@/components/Layout.tsx";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <Layout>
      <main className="p-8 leading-relaxed">
        <section className="mb-6">
          <h2 className="font-bold text-xl border-b border-border mb-2">
            About Me
          </h2>
          <p>
            Henlo, I am here! Local fool who likes to talk. Die hard Oklahoman
            (Okie). Red Truck. God & State. Scooby Doo is the pinnacle of
            animation (pre-youtube).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold text-xl border-b border-border mb-2">
            TODO
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Quest 1: Build Games</li>
            <li>Quest 2: Rant against city infrastructure</li>
            <li>Quest 3: Gift buying guide</li>
          </ul>
        </section>
      </main>
    </Layout>
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}

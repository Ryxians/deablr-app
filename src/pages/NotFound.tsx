/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "@/components/Layout.tsx";
// @ts-expect-error idk man
import inYourWalls from "#/in-your-walls.gif";

const elem = document.getElementById("root")!;
const app = (
    <StrictMode>
        <Layout>
            <main className="p-8 leading-relaxed">
                <section className="mb-6">
                    <h2 className="font-bold text-xl border-b border-border mb-2">
                        Not Found
                    </h2>
                    <p>Sowwy, this is not a valid page.</p>
                </section>
                <section className={"mb-6"}>
                    <img src={inYourWalls} alt={"I am in your walls."} />
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

// @ts-expect-error idk man
import inYourWalls from "#/in-your-walls.gif";
import React from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/components/Layout.tsx";

export const NotFound: React.FC = () => {
  return (
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
  );
};

export const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/not-found",
  component: NotFound,
});

import * as React from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/components/Layout.tsx";

export const AboutMe: React.FC = () => {
  return (
    <div>
      <section className="mb-6">
        <h2 className="font-bold text-xl border-b border-border mb-2">
          About Me
        </h2>
        <p>
          Henlo, I am here! Local fool who likes to talk. Will be an extremist
          if it's funny. Die hard Oklahoman (Okie). Red Truck. God & State.
          Scooby Doo is the pinnacle of animation (pre-youtube). Broken Arrow
          native.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="font-bold text-xl border-b border-border mb-2">TODO</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Quest 1: Build Games</li>
          <li>Quest 2: Rant against city infrastructure</li>
          <li>Quest 3: Gift buying guide</li>
        </ul>
      </section>
    </div>
  );
};

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AboutMe,
});

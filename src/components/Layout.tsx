import { type PropsWithChildren } from "react";
import * as React from "react";
import { Header } from "@/components/Header.tsx";
import { Navbar } from "@/components/Navbar.tsx";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "@/components/Footer.tsx";

export const rootRoute = createRootRoute({
  component: () => (
    <>
      <Layout>
        <Outlet />
      </Layout>
    </>
  ),
});

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-6">
      <div className="max-w-5xl min-w-4xl mx-auto border border-border shadow-sm bg-card">
        <Header />
        <Navbar />
        <main className="p-8 leading-relaxed">{children}</main>
      </div>
      {/*<Footer />*/}
    </div>
  );
};

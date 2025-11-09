import { type PropsWithChildren } from "react";
import * as React from "react";
import { Header } from "@/components/Header.tsx";
import { Navbar } from "@/components/Navbar.tsx";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-foreground font-mono p-6">
            <div className="max-w-5xl mx-auto border border-border shadow-sm bg-card">
                <Header />
                <Navbar />
                <main className="p-8 leading-relaxed">{children}</main>
            </div>
        </div>
    );
};

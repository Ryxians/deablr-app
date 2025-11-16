import * as React from "react";
import { Link } from "@tanstack/react-router";

export function Navbar() {
  return (
    <nav className="flex justify-center gap-6 border-b border-border bg-muted py-3 text-primary font-bold uppercase text-sm tracking-wide [&>*]:hover:text-accent [&>*]:underline [&>*]:underline-offset-2">
      <Link to={"/"}>About Me</Link>
      <Link to={"/not-found"}>Yummy</Link>
      <Link to={"/not-found"}>Manifesto</Link>
      <Link to={"/not-found"}>Shopping List</Link>
      <Link to={"/not-found"}>Web Games</Link>
    </nav>
  );
}

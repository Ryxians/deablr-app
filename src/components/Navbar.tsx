import * as React from "react";
import type { PropsWithChildren } from "react";

const DeabLink: React.FC<{ link: string } & PropsWithChildren> = ({
  children,
  link,
}) => {
  return (
    <a href={link} className="hover:text-accent underline underline-offset-2">
      {children}
    </a>
  );
};

export function Navbar() {
  return (
    <nav className="flex justify-center gap-6 border-b border-border bg-muted py-3 text-primary font-bold uppercase text-sm tracking-wide">
      <DeabLink link={"index.html"}>About Me</DeabLink>
      <DeabLink link={"yummy.html"}>Yummy</DeabLink>
      <DeabLink link={"manifesto.html"}>Manifesto</DeabLink>
      <DeabLink link={"gifts.html"}>Shopping List</DeabLink>
      <DeabLink link={"games.html"}>Web Games</DeabLink>
      {/*<DeabLink>*/}
      {/*    Timepiece*/}
      {/*</DeabLink>*/}
    </nav>
  );
}

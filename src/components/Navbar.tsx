import { Link } from "@tanstack/react-router"

export function Navbar() {
  return (
    <nav className="flex justify-center gap-6 border-b border-border bg-muted py-3 text-primary font-bold uppercase text-sm tracking-wide [&>*]:hover:text-accent [&>*]:underline [&>*]:underline-offset-2">
      <Link to="/">About Me</Link>
      <Link to="/wordle">Wordle</Link>
      <Link to="/manifesto">Manifesto</Link>
      <Link to="/shopping-list">Shopping List</Link>
      <Link to="/web-games">Web Games</Link>
    </nav>
  )
}

import { Link } from "@tanstack/react-router"
import { Navbar } from "@/components/Navbar"

export function Header() {
  return (
    <>
      <header className="penny-watermark flex flex-col items-center px-4 pt-4 pb-3 text-center md:pt-10 md:pb-8">
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:gap-4"
        >
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[oklch(0.94_0.03_230)] ring-2 ring-secondary/70 transition-transform group-hover:-rotate-12 md:size-14">
            <span
              aria-hidden
              className="block size-full scale-[1.15] bg-(image:--dog-logo) bg-contain bg-center bg-no-repeat mix-blend-multiply"
            />
          </span>
          <span className="font-mono text-[1.375rem] font-extrabold tracking-tight text-foreground [text-shadow:2px_2px_0_var(--primary)] md:text-[2.75rem] md:leading-none md:[text-shadow:0.07em_0.07em_0_var(--primary)]">
            MY DIGITAL ABODE
          </span>
        </Link>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground italic md:mt-3 md:text-[15px]">
          Experiments, Musings, and Stuff I Want
        </p>
      </header>
      <Navbar />
    </>
  )
}

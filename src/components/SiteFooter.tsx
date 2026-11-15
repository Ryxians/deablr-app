export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border/80 bg-well/50 px-4 py-4 font-mono text-xs text-muted-foreground sm:px-6 md:px-10">
      <span>Built by hand in Broken Arrow, OK.</span>
      <span className="flex items-center gap-2">
        <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-[oklch(0.94_0.03_230)] ring-1 ring-secondary/60">
          <img
            src="/penny.svg"
            alt=""
            className="size-full scale-[1.15] -rotate-12 mix-blend-multiply"
          />
        </span>
        Penny approved.
      </span>
    </footer>
  )
}

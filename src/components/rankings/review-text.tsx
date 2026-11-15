import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ReactNode } from "react"
import type { Components } from "react-markdown"

import { prepareSpoilers, remarkSpoiler } from "@/lib/remark-spoiler"
import { cn } from "@/lib/utils"

/**
 * A <spoiler> region: hidden behind a solid bar until clicked (or activated
 * by keyboard). Inline spoilers render as spans so they can sit mid-
 * paragraph; block spoilers render as outlined boxes.
 */
function Spoiler({
  inline,
  children,
}: {
  inline: boolean
  children?: ReactNode
}) {
  const [revealed, setRevealed] = useState(false)
  const Tag = inline ? "span" : "div"
  return (
    <Tag
      role="button"
      tabIndex={0}
      aria-expanded={revealed}
      title={revealed ? "Hide spoiler" : "Reveal spoiler"}
      onClick={() => setRevealed((r) => !r)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setRevealed((r) => !r)
        }
      }}
      className={cn(
        "cursor-pointer rounded-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        inline
          ? "px-1 py-0.5"
          : "my-3 block rounded-lg border border-dashed border-border p-4",
        revealed
          ? "bg-well/70"
          : "bg-[repeating-linear-gradient(-45deg,oklch(0.5_0.09_262)_0_6px,var(--well)_6px_12px)] hover:brightness-125"
      )}
    >
      <span
        className={cn(
          inline ? "" : "block",
          !revealed && "pointer-events-none opacity-0 select-none"
        )}
      >
        {children}
      </span>
    </Tag>
  )
}

/** Props react-markdown hands every component (hast `node` unused here). */
type MdProps = { node?: unknown; children?: ReactNode }

const components = {
  spoiler: (props: MdProps & { "data-inline"?: string }) => (
    <Spoiler inline={"data-inline" in props}>{props.children}</Spoiler>
  ),
  p: ({ children }: MdProps) => (
    <p className="my-4 first:mt-0 last:mb-0">{children}</p>
  ),
  a: ({ children, href }: MdProps & { href?: string }) => (
    <a
      href={href}
      className="font-semibold text-secondary underline decoration-secondary/40 underline-offset-[3px] hover:decoration-secondary"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }: MdProps) => (
    <ul className="my-4 list-disc space-y-1 pl-6 marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children }: MdProps) => (
    <ol className="my-4 list-decimal space-y-1 pl-6 marker:font-mono marker:text-primary">
      {children}
    </ol>
  ),
  li: ({ children }: MdProps) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }: MdProps) => (
    <blockquote className="my-4 border-l-[3px] border-primary pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ children }: MdProps) => (
    <code className="rounded-sm bg-well px-1.5 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }: MdProps) => (
    <pre className="my-4 overflow-x-auto rounded-lg border border-border/70 bg-well p-4 font-mono text-sm [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  h1: ({ children }: MdProps) => (
    <h1 className="mt-8 mb-3 text-2xl font-extrabold tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: MdProps) => (
    <h2 className="mt-8 mb-3 text-xl font-extrabold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: MdProps) => (
    <h3 className="mt-6 mb-2 text-lg font-bold first:mt-0">{children}</h3>
  ),
  h4: ({ children }: MdProps) => (
    <h4 className="mt-6 mb-2 font-bold first:mt-0">{children}</h4>
  ),
  hr: () => <hr className="my-8 border-border/70" />,
  img: ({ src, alt }: MdProps & { src?: string; alt?: string }) => (
    <img src={src} alt={alt} className="my-4 max-w-full rounded-lg" />
  ),
  table: ({ children }: MdProps) => (
    <table className="my-4 border-collapse text-sm">{children}</table>
  ),
  th: ({ children }: MdProps) => (
    <th className="border border-border bg-well px-3 py-1.5 text-left font-mono text-xs">
      {children}
    </th>
  ),
  td: ({ children }: MdProps) => (
    <td className="border border-border px-3 py-1.5">{children}</td>
  ),
} as Components

/** A Review's text, rendered as Markdown with <spoiler> tag support. */
export function ReviewText({ text }: { text: string }) {
  return (
    <section className="mt-10 border-t border-border/70 pt-8">
      <div className="max-w-[65ch] text-[17px] leading-relaxed text-foreground/95">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkSpoiler]}
          components={components}
        >
          {prepareSpoilers(text)}
        </ReactMarkdown>
      </div>
    </section>
  )
}

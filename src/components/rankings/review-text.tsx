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
        "cursor-pointer rounded transition-colors",
        inline ? "px-1" : "my-2 block border border-dashed border-border p-3",
        revealed ? "bg-muted/40" : "bg-foreground"
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
    <p className="my-3 first:mt-0 last:mb-0">{children}</p>
  ),
  a: ({ children, href }: MdProps & { href?: string }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }: MdProps) => (
    <ul className="my-2 list-disc pl-6">{children}</ul>
  ),
  ol: ({ children }: MdProps) => (
    <ol className="my-2 list-decimal pl-6">{children}</ol>
  ),
  li: ({ children }: MdProps) => <li className="my-0.5">{children}</li>,
  blockquote: ({ children }: MdProps) => (
    <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }: MdProps) => (
    <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }: MdProps) => (
    <pre className="my-2 overflow-x-auto rounded bg-muted p-3 text-sm [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  h1: ({ children }: MdProps) => (
    <h1 className="mt-4 mb-2 text-xl font-bold">{children}</h1>
  ),
  h2: ({ children }: MdProps) => (
    <h2 className="mt-4 mb-2 text-lg font-bold">{children}</h2>
  ),
  h3: ({ children }: MdProps) => (
    <h3 className="mt-3 mb-1 font-bold">{children}</h3>
  ),
  h4: ({ children }: MdProps) => (
    <h4 className="mt-3 mb-1 font-bold">{children}</h4>
  ),
  hr: () => <hr className="my-4 border-border" />,
  img: ({ src, alt }: MdProps & { src?: string; alt?: string }) => (
    <img src={src} alt={alt} className="my-2 max-w-full rounded" />
  ),
  table: ({ children }: MdProps) => (
    <table className="my-2 border-collapse text-sm">{children}</table>
  ),
  th: ({ children }: MdProps) => (
    <th className="border border-border px-2 py-1 text-left">{children}</th>
  ),
  td: ({ children }: MdProps) => (
    <td className="border border-border px-2 py-1">{children}</td>
  ),
} as Components

/** A Review's text, rendered as Markdown with <spoiler> tag support. */
export function ReviewText({ text }: { text: string }) {
  return (
    <div className="mt-6 max-w-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkSpoiler]}
        components={components}
      >
        {prepareSpoilers(text)}
      </ReactMarkdown>
    </div>
  )
}

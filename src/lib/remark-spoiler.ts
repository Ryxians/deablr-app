/**
 * Remark plugin adding <spoiler>...</spoiler> support to review Markdown.
 *
 * Raw spoiler tags surface in the mdast as `html` nodes. This plugin wraps
 * everything between an opening and closing tag in a `spoiler` node (mapped
 * to the `<spoiler>` element via `data.hName`) so react-markdown renders it
 * through a custom component — no raw HTML is ever emitted, so arbitrary
 * other tags still render as harmless literal text. Markdown inside the tags
 * keeps working; tags may nest; unmatched tags are left as literal text.
 */

export interface MdastNode {
  type: string
  value?: string
  children?: Array<MdastNode>
  data?: {
    hName?: string
    hProperties?: Record<string, unknown>
  }
}

/** mdast containers whose children flow inline rather than as blocks. */
const INLINE_PARENTS = new Set([
  "paragraph",
  "heading",
  "emphasis",
  "strong",
  "delete",
  "link",
  "tableCell",
])

const OPEN = /^<spoiler>$/i
const CLOSE = /^<\/spoiler>$/i

/**
 * Normalizes spoiler tags so block-positioned tags become standalone mdast
 * `html` nodes. A tag alone on its line starts a CommonMark HTML block that
 * swallows following lines until a blank line, so blank lines are forced
 * around such tags; one-line `<spoiler>…</spoiler>` lines are unfolded the
 * same way. Inline usages (tags mid-line) already parse as discrete inline
 * `html` nodes and are left untouched.
 */
export function prepareSpoilers(text: string): string {
  return text
    .replace(
      /^[ \t]*<spoiler>(\S.*)<\/spoiler>[ \t]*$/gim,
      "<spoiler>\n\n$1\n\n</spoiler>"
    )
    .replace(/^[ \t]*(<\/?spoiler>)[ \t]*\r?$/gim, "\n\n$1\n\n")
}

export function remarkSpoiler() {
  return (tree: MdastNode) => {
    wrapInTree(tree)
  }
}

function wrapInTree(node: MdastNode) {
  if (!node.children) return
  const inline = INLINE_PARENTS.has(node.type)
  node.children = wrapSpoilers(node.children, inline)
  for (const child of node.children) wrapInTree(child)
}

function wrapSpoilers(
  children: Array<MdastNode>,
  inline: boolean
): Array<MdastNode> {
  const out: Array<MdastNode> = []
  const stack: Array<Array<MdastNode>> = []
  let current = out
  for (const child of children) {
    const html = child.type === "html" ? child.value?.trim() : undefined
    if (html && OPEN.test(html)) {
      const spoiler: MdastNode = {
        type: "spoiler",
        children: [],
        data: {
          hName: "spoiler",
          hProperties: inline ? { "data-inline": "true" } : undefined,
        },
      }
      current.push(spoiler)
      stack.push(current)
      current = spoiler.children as Array<MdastNode>
      continue
    }
    if (html && CLOSE.test(html) && stack.length > 0) {
      current = stack.pop() as Array<MdastNode>
      continue
    }
    current.push(child)
  }
  return out
}

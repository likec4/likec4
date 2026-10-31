import type { Nodes } from 'mdast'
import { extractRefs } from './extract-refs'
import { visitRefs } from './refs'
import type { MarkdownRef, MarkdownRefTitleResolver } from './types'

/**
 * Returns the text a ref is displayed with:
 * the label if specified, otherwise the resolved title, otherwise the target.
 */
export function markdownRefText(ref: MarkdownRef, resolve?: MarkdownRefTitleResolver): string {
  return ref.label ?? resolve?.(ref) ?? ref.target
}

/**
 * Replaces the fallback text of ref nodes (outside links) with {@link markdownRefText}.
 */
export function resolveRefNodes(tree: Nodes, resolve: MarkdownRefTitleResolver): void {
  visitRefs(tree, node => {
    node.value = markdownRefText(node.ref, resolve)
  })
}

/**
 * Remark plugin, resolves the text of ref nodes, see {@link resolveRefNodes}.
 * Must be used after `remarkLikeC4Refs`.
 */
export function remarkResolveLikeC4Refs(resolve: MarkdownRefTitleResolver) {
  return (tree: Nodes) => {
    resolveRefNodes(tree, resolve)
  }
}

/**
 * Characters with a meaning in inline Markdown (emphasis, links, code, html, entities, headings, GFM tables and strikethrough)
 */
const inlineMarkdownSpecialRe = /[\\`*_[\]<>#|~&]/g

/**
 * Escapes Markdown-significant characters with a backslash, so that the text is rendered literally.
 * Also keeps `|` from splitting a GFM table cell.
 */
export function escapeInlineMarkdown(text: string): string {
  return text.replace(inlineMarkdownSpecialRe, '\\$&')
}

export type ResolveMarkdownRefsOptions = {
  /**
   * Escape the inserted text (see {@link escapeInlineMarkdown}),
   * use when the result is rendered as Markdown.
   * @default false
   */
  escape?: boolean
}

/**
 * Rewrites refs (`[[fqn]]`, `[[fqn|label]]`, `[[view:id]]`) in Markdown source to plain text:
 * the label, otherwise the resolved title, otherwise the target.
 * The rest of the Markdown is preserved as is.
 *
 * For outputs that keep Markdown source but can't render refs (Markdown and Draw.io exports).
 * The inserted text is not escaped, unless `options.escape` is set.
 *
 * @example
 * resolveMarkdownRefs('Calls [[cloud.api]]', ref => model.findElement(ref.target)?.title ?? null)
 * // 'Calls API'
 */
export function resolveMarkdownRefs(
  md: string,
  resolve?: MarkdownRefTitleResolver,
  options?: ResolveMarkdownRefsOptions,
): string {
  const refs = extractRefs(md)
  const escape = options?.escape === true
  let result = md
  // Splice from the end, so that offsets of preceding refs stay valid
  for (let i = refs.length - 1; i >= 0; i--) {
    const ref = refs[i]!
    const text = markdownRefText(ref, resolve)
    result = result.slice(0, ref.range.start) + (escape ? escapeInlineMarkdown(text) : text)
      + result.slice(ref.range.end)
  }
  return result
}

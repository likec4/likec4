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
 * Rewrites refs (`[[fqn]]`, `[[fqn|label]]`, `[[view:id]]`) in Markdown source to plain text:
 * the label, otherwise the resolved title, otherwise the target.
 * The rest of the Markdown is preserved as is.
 *
 * For outputs that keep Markdown source but can't render refs (Markdown and Draw.io exports).
 * The inserted text is not escaped.
 *
 * @example
 * resolveMarkdownRefs('Calls [[cloud.api]]', ref => model.findElement(ref.target)?.title ?? null)
 * // 'Calls API'
 */
export function resolveMarkdownRefs(md: string, resolve?: MarkdownRefTitleResolver): string {
  const refs = extractRefs(md)
  let result = md
  // Splice from the end, so that offsets of preceding refs stay valid
  for (let i = refs.length - 1; i >= 0; i--) {
    const ref = refs[i]!
    result = result.slice(0, ref.range.start) + markdownRefText(ref, resolve) + result.slice(ref.range.end)
  }
  return result
}

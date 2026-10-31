import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { remarkLikeC4Refs, visitRefs } from './refs'
import type { MarkdownRef } from './types'

// Same syntax as markdownToHtml (GFM affects tables, autolinks, etc.)
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkLikeC4Refs)
  .freeze()

/**
 * Extracts links to model elements and views (`[[fqn]]`, `[[fqn|label]]`, `[[view:id]]`) from Markdown.
 *
 * Refs inside inline code, fenced code and links, and escaped refs (`\[[`) are ignored.
 * Offsets in `range` and `targetRange` are offsets in `md`.
 *
 * @param md - Markdown source
 * @returns refs in order of appearance
 */
export function extractRefs(md: string): MarkdownRef[] {
  if (!md.includes('[[')) {
    return []
  }
  const refs: MarkdownRef[] = []
  visitRefs(processor.parse(md), node => {
    refs.push({
      ...node.ref,
      range: { ...node.ref.range },
      targetRange: { ...node.ref.targetRange },
    })
  })
  return refs
}

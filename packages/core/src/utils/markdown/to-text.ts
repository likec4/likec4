import { fromMarkdown } from 'mdast-util-from-markdown'
import { toString } from 'mdast-util-to-string'

/**
 * Converts markdown to plain text, removing any markdown formatting.
 * @param markdown - The markdown to convert.
 * @returns The plain text.
 */
export function markdownToText(markdown: string): string {
  return toString(fromMarkdown(markdown), {
    includeHtml: false,
    includeImageAlt: false,
  })
}

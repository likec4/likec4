import type { Nodes } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toString } from 'mdast-util-to-string'
import { likec4RefFromMarkdown, likec4RefSyntax } from './refs'
import { resolveRefNodes } from './resolve-refs'
import type { MarkdownRefTitleResolver } from './types'

const options = {
  includeHtml: false,
  includeImageAlt: false,
}

/**
 * Collects the text of each block (paragraph, heading, list item, table row, ...)
 * so that blocks can be joined with line breaks instead of being glued together.
 */
function collectBlocks(node: Nodes, blocks: string[]): void {
  switch (node.type) {
    case 'paragraph':
    case 'heading':
    case 'code':
    case 'html':
    case 'text':
    case 'inlineCode': {
      blocks.push(toString(node, options))
      return
    }
    case 'tableRow': {
      blocks.push(node.children.map(cell => toString(cell, options)).join(' '))
      return
    }
  }
  if ('children' in node) {
    for (const child of node.children) {
      collectBlocks(child, blocks)
    }
  }
}

/**
 * Converts markdown to plain text, removing any markdown formatting.
 * Blocks (paragraphs, headings, list items, table rows) are separated by line breaks.
 * Refs (`[[fqn|label]]`) become their label, otherwise the title from `resolve`, otherwise the target.
 * @param markdown - The markdown to convert.
 * @param resolve - Optional resolver of ref titles (e.g. from the model).
 * @returns The plain text.
 */
export function markdownToText(markdown: string, resolve?: MarkdownRefTitleResolver): string {
  const blocks: string[] = []
  const tree = fromMarkdown(markdown, {
    extensions: [likec4RefSyntax],
    mdastExtensions: [likec4RefFromMarkdown],
  })
  if (resolve) {
    resolveRefNodes(tree, resolve)
  }
  collectBlocks(tree, blocks)
  return blocks.filter(block => block !== '').join('\n')
}

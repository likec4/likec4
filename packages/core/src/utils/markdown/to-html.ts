import defu from 'defu'
import type { Element } from 'hast'
import type { State } from 'mdast-util-to-hast'
import rehypePrism from 'rehype-prism-plus/common'
import rehypeSanitize, { type Options as SanitizeSchema, defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { type LikeC4RefNode, remarkLikeC4Refs } from './refs'

/**
 * Renders a ref as `<a data-likec4-ref="<target>" data-likec4-ref-kind="<kind>">label or target</a>`.
 * If the ref has a label, the anchor also has an empty `data-likec4-ref-label` attribute,
 * so that consumers keep the label instead of replacing it with the title.
 * Resolving the target (title, click) is up to the consumer, who has the model.
 */
function likec4RefToHast(state: State, node: LikeC4RefNode): Element {
  const result: Element = {
    type: 'element',
    tagName: 'a',
    properties: {
      dataLikec4Ref: node.ref.target,
      dataLikec4RefKind: node.ref.kind,
      ...(node.ref.label !== null && { dataLikec4RefLabel: true }),
    },
    children: [{ type: 'text', value: node.value }],
  }
  state.patch(node, result)
  return state.applyData(node, result)
}

/**
 * Allowed attributes of the ref anchor, see {@link likec4RefToHast}
 */
const likec4RefAttributes: NonNullable<SanitizeSchema['attributes']>[string] = [
  'dataLikec4Ref',
  ['dataLikec4RefKind', 'element', 'view', 'unknown'],
  'dataLikec4RefLabel',
]

function parser() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkLikeC4Refs)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      handlers: {
        likec4Ref: likec4RefToHast,
      },
    })
    .use(rehypePrism, { ignoreMissing: true })
    .use(
      rehypeSanitize,
      defu(
        {
          attributes: {
            '*': [
              'className',
            ],
            'a': likec4RefAttributes,
            'svg': [
              'width',
              'height',
              'viewBox',
              'fill',
              'ariaHidden',
            ],
            'path': ['d', 'fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin'],
          },
          tagNames: [
            'svg',
            'g',
            'path',
            'div',
          ],
          protocols: {
            src: ['data'],
          },
        },
        defaultSchema,
      ),
    )
    .use(rehypeStringify, {
      allowDangerousHtml: true,
    })
}

export function markdownToHtml(markdown: string): string {
  return ('' + parser().processSync(markdown)).trim()
}

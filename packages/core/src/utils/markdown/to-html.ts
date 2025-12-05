import defu from 'defu'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

function parser() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(
      rehypeSanitize,
      defu(
        {
          attributes: {
            '*': [
              'className',
            ],
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

import defu from 'defu'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkGitHubAlerts } from 'remark-github-markdown-alerts'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

// let _remark
function remark() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGitHubAlerts, {
      mode: 'html',
    })
    .use(remarkRehype, {
      // Tight paragraphs prevent extra newlines
      allowDangerousHtml: true,
      clobberPrefix: '',
      tableCellPadding: false,
      tight: true,
    })
    .use(rehypeRaw)
    .use(
      rehypeSanitize,
      defu(
        {
          attributes: {
            '*': [
              'className',
            ],
          },
        },
        defaultSchema,
      ),
    )
    .use(rehypeStringify, {
      allowDangerousHtml: true,
      // Prevent extra closing newlines
      closeSelfClosing: true,
      tightSelfClosing: true,
    })
}

export function markdownToHtml(markdown: string): string {
  return ('' + remark().processSync(markdown)).trim()
}

import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

// let _remark
function remark() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {
      // Tight paragraphs prevent extra newlines
      allowDangerousHtml: true,
      clobberPrefix: '',
      tableCellPadding: false,
      tight: true,
    })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify, {
      // Prevent extra closing newlines
      closeSelfClosing: true,
      tightSelfClosing: true,
    })
}

export function markdownToHtml(markdown: string): string {
  return String(remark().processSync(markdown.trim())).trim()
}

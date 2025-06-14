import type { Root } from 'mdast'
import rehypeFormat from 'rehype-format'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { type Processor, unified } from 'unified'

let _remark
function remark(): Processor<Root, Root, Root, Root, string> {
  return _remark ??= unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeRaw)
    .use(rehypeFormat)
    .use(rehypeSanitize)
    .use(rehypeStringify)
}

export function markdownToHtml(markdown: string): string {
  return String(remark().processSync(markdown)).trim()
}

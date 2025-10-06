import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { skip } from './llms.txt'

const docs = await getCollection('docs')

const filterOutMdxImports = (text: string = '') => {
  return text
    .split('\n')
    .filter((line) =>
      !(
        line.includes('import')
        && (line.includes('@astrojs/starlight/components') || line.includes('@components/'))
      )
    )
    .join('\n')
}

export const GET: APIRoute = async () => {
  return new Response(
    docs
      .filter(({ id }) => !skip.includes(id))
      .map((doc) => {
        return `# ${doc.data.title}\n\n${filterOutMdxImports(doc.body)}\n\n`
      })
      .join(''),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}

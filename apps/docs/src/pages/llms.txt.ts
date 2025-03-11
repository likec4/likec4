import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const docs = await getCollection('docs')

export const skip = [
  '404',
  'examples/bigbank',
]

export const GET: APIRoute = async ({ params, request }) => {
  return new Response(
    `# LikeC4 Documentation\n\n${
      docs
        .filter(({ id }) => !skip.includes(id))
        .map((doc) => {
          return `- [${doc.data.title}](https://likec4.dev/${doc.id}/)\n`
        })
        .join('')
    }`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}

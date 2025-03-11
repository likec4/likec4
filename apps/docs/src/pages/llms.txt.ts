import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const docs = await getCollection('docs')

export const GET: APIRoute = async ({ params, request }) => {
  return new Response(
    `# LikeC4 Documentation\n\n${
      docs
        .map((doc) => {
          return `- [${doc.data.title}](https://likec4.dev/${doc.slug}/)\n`
        })
        .join('')
    }`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}

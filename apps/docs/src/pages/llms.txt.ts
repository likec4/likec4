import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const docs = await getCollection('docs')

export const skip = (id: string): boolean => {
  return id.startsWith('showcases') || [
    '404',
    'sponsor',
  ].includes(id)
}

export const GET: APIRoute = async () => {
  return new Response(
    `# LikeC4 Documentation\n\n${
      docs
        .filter(({ id }) => !skip(id))
        .map((doc) => {
          return `- [${doc.data.title}](https://likec4.dev/${doc.id}/)\n`
        })
        .join('')
    }`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}

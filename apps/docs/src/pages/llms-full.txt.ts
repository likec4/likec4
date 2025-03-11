import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const docs = await getCollection('docs')

export const GET: APIRoute = async ({}) => {
  return new Response(
    docs
      .map((doc) => {
        return `# ${doc.data.title}\n\n${doc.body}\n\n`
      })
      .join(''),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}

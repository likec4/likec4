import type { APIRoute } from 'astro'
import schema from '@likec4/config/schema.json' with { type: 'json' }

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(schema),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  )
}

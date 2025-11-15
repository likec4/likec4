import { ifilter } from '@likec4/core/utils'
import * as z from 'zod/v3'
import { likec4Tool, logger } from '../utils'
import { includedInViews, includedInViewsSchema } from './_common'

const searchResultSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('element'),
      project: z.string().describe('Project ID'),
      id: z.string().describe('Element ID (FQN)'),
      name: z.string().describe('Element name'),
      kind: z.string(),
      title: z.string(),
      technology: z.string().nullable(),
      shape: z.string(),
      includedInViews: includedInViewsSchema,
      metadata: z.record(z.union([z.string(), z.array(z.string())])),
      tags: z.array(z.string()),
    }),
    z.object({
      type: z.literal('deployment-node'),
      project: z.string().describe('Project ID'),
      id: z.string().describe('Deployment ID (FQN)'),
      name: z.string().describe('Deployment name'),
      kind: z.string(),
      title: z.string(),
      technology: z.string().nullable(),
      shape: z.string(),
      includedInViews: includedInViewsSchema,
      metadata: z.record(z.union([z.string(), z.array(z.string())])),
      tags: z.array(z.string()),
    }),
  ]),
)

export const searchElement = likec4Tool({
  name: 'search-element',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Search elements',
  },
  description: `
Search LikeC4 elements and deployment nodes across all projects.

Query syntax (case-insensitive):
- kind:<value>  filters by kind
- shape:<value> filters by shape
- meta:<key>    filters by having metadata with the given key
- #<value>      matches assigned tags
- <value>       matches id (FQN) or title

Request:
- search: string — at least 2 characters

Response (JSON object):
- total: number - total number of results
- found: Result[] - returns top 20 results

Result (discriminated union by "type"):
- type = "element": { id: string, name: string, kind: string, title: string, technology: string|null, shape: string, project: string, includedInViews: View[], tags: string[], metadata: Record<string, string> }
- type = "deployment-node": { id: string, name: string, kind: string, title: string, technology: string|null, shape: string, project: string, includedInViews: View[], tags: string[], metadata: Record<string, string> }

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent.
- Use results as input to other tools (e.g., read-element, read-view).

Example response:
{
  "total": 1,
  "found": [
    {
      "type": "logical",
      "project": "default",
      "id": "shop.frontend",
      "name": "frontend",
      "kind": "container",
      "title": "Frontend",
      "technology": "React",
      "shape": "rectangle",      
      "includedInViews": [
        {
          "id": "system-overview",
          "title": "System Overview",
          "type": "element"
        }
      ],
      "tags": ["public"],
      "metadata": {}
    }
  ]
}
`,
  inputSchema: {
    search: z.string().min(2, 'Search must be at least 2 characters long'),
  },
  outputSchema: {
    total: z.number(),
    found: searchResultSchema,
  },
}, async (languageServices, args) => {
  const projects = languageServices.projects()
  const found = [] as z.infer<typeof searchResultSchema>
  let search = args.search.toLowerCase()

  let predicate: <
    E extends {
      id: string
      title: string
      kind: string
      shape: string
      tags: readonly string[]
      getMetadata: (key: string) => string | string[] | undefined
    },
  >(
    el: E,
  ) => boolean

  if (search.startsWith('kind:')) {
    search = search.slice(5)
    logger.debug('search by kind: {search}', { search })
    predicate = (el) => el.kind.toLowerCase() === search
  } else if (search.startsWith('shape:')) {
    search = search.slice(6)
    logger.debug('search by shape: {search}', { search })
    predicate = (el) => el.shape.toLowerCase() === search
  } else if (search.startsWith('meta:')) {
    search = search.slice(5)
    logger.debug('search by metadata: {search}', { search })
    predicate = (el) => !!el.getMetadata(search)
  } else if (search.startsWith('#')) {
    search = search.slice(1)
    logger.debug('search by tag: {search}', { search })
    predicate = (el) => el.tags.some(tag => tag.toLowerCase().includes(search))
  } else {
    logger.debug('search by id/title: {search}', { search })
    predicate = (el) =>
      el.id.toLowerCase().includes(search)
      || el.title.toLowerCase().includes(search)
  }

  for (const project of projects) {
    try {
      const model = await languageServices.computedModel(project.id)

      // filter elements
      for (const el of ifilter(model.elements(), e => !e.imported && predicate(e))) {
        found.push({
          type: 'element',
          project: project.id,
          id: el.id,
          name: el.name,
          kind: el.kind,
          title: el.title,
          technology: el.technology,
          shape: el.shape,
          tags: [...el.tags],
          metadata: el.getMetadata(),
          includedInViews: includedInViews(el.views()),
        })
      }

      // filter deployment nodes
      for (const el of ifilter(model.deployment.nodes(), predicate)) {
        found.push({
          type: 'deployment-node',
          project: project.id,
          id: el.id,
          name: el.name,
          kind: el.kind,
          title: el.title,
          technology: el.technology,
          shape: el.shape,
          tags: [...el.tags],
          metadata: el.getMetadata(),
          includedInViews: includedInViews(el.views()),
        })
      }
    } catch (error) {
      logger.error(`Error searching in project ${project.id}:`, { error })
    }
  }

  return {
    total: found.length,
    found: found.slice(0, 20),
  }
})

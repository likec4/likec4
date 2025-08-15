import { ifilter } from '@likec4/core/utils'
import z from 'zod'
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
- Free text: matches id (FQN) or title
- kind:<value>: filters by kind
- shape:<value>: filters by shape
- #<value>: matches assigned tags

Request:
- search: string — at least 2 characters

Response (JSON object):
- found: Result[] - returns top 20 results
- total: number - total number of results

Result (discriminated union by "type"):
- type = "element": { id: string, name: string, kind: string, title: string, technology: string|null, shape: string, project: string, includedInViews: View[], tags: string[] }
- type = "deployment-node": { id: string, name: string, kind: string, title: string, technology: string|null, shape: string, project: string, includedInViews: View[], tags: string[] }

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent.
- Use results as input to other tools (e.g., read-element, read-view).

Example response:
{
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
      "tags": ["public"]
    }
  ]
}
`,
  inputSchema: {
    search: z.string().min(2, 'Search must be at least 2 characters long'),
  },
  outputSchema: {
    found: searchResultSchema,
    total: z.number(),
  },
}, async (languageServices, args) => {
  const projects = languageServices.projects()
  const found = [] as z.infer<typeof searchResultSchema>
  let search = args.search.toLowerCase()

  let predicate: <E extends { id: string; title: string; kind: string; shape: string; tags: readonly string[] }>(
    el: E,
  ) => boolean

  if (search.startsWith('kind:')) {
    search = search.slice(5)
    predicate = (el) => el.kind.toLowerCase().includes(search)
  } else if (search.startsWith('shape:')) {
    search = search.slice(6)
    predicate = (el) => el.shape.toLowerCase().includes(search)
  } else if (search.startsWith('#')) {
    search = search.slice(1)
    predicate = (el) => el.tags.some(tag => tag.toLowerCase().includes(search))
  } else {
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
          includedInViews: includedInViews(el.views()),
        })
      }
    } catch (error) {
      logger.error(`Error searching in project ${project.id}:`, { error })
    }
  }

  return {
    found: found.slice(0, 20),
    total: found.length,
  }
})

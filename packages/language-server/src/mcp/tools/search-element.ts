import { ifilter } from '@likec4/core/utils'
import z from 'zod'
import { likec4Tool } from '../utils'

const searchResultSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('logical'),
      id: z.string().describe('Element ID (FQN)'),
      kind: z.string(),
      title: z.string(),
      shape: z.string(),
      project: z.string().describe('Project name'),
      tags: z.array(z.string()),
    }),
    z.object({
      type: z.literal('deployment-node'),
      id: z.string().describe('Deployment ID (FQN)'),
      kind: z.string(),
      title: z.string(),
      shape: z.string(),
      project: z.string().describe('Project name'),
      tags: z.array(z.string()),
    }),
  ]),
)

export const searchElement = likec4Tool({
  name: 'search-element',
  annotations: {
    readOnlyHint: true,
  },
  description: `
Search for LikeC4 elements and deployment nodes by partial match of:
- id (FQN)
- title
- kind (if search string starts with "kind:")
- shape (if search string starts with "shape:")
- any assigned tags (if search string starts with "#")

Returns array of found elements with:
- type (logical or deployment-node)
- id (FQN)
- kind
- title
- shape
- project name this element belongs to
- assigned tags

Can be used for further requests (like read-element or read-project-summary)
`.trimStart(),
  inputSchema: {
    search: z.string().min(2, 'Search must be at least 2 characters long'),
  },
  outputSchema: {
    found: searchResultSchema,
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
      for (const el of ifilter(model.elements(), predicate)) {
        found.push({
          type: 'logical',
          id: el.id,
          kind: el.kind,
          title: el.title,
          shape: el.shape,
          project: project.id,
          tags: [...el.tags],
        })
      }

      // filter deployment nodes
      for (const el of ifilter(model.deployment.nodes(), predicate)) {
        found.push({
          type: 'deployment-node',
          id: el.id,
          kind: el.kind,
          title: el.title,
          shape: el.shape,
          project: project.id,
          tags: [...el.tags],
        })
      }
    } catch (error) {
      console.error(`Error searching in project ${project.id}:`, error)
    }
  }

  return {
    found,
  }
})

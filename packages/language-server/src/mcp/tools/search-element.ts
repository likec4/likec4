import { ifilter, isome } from '@likec4/core/utils'
import z from 'zod'
import { likec4Tool } from '../utils'

const searchResultSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('logical'),
      id: z.string().describe('Element ID (FQN)'),
      kind: z.string(),
      title: z.string(),
      project: z.string().describe('Project name'),
      tags: z.array(z.string()),
    }),
    z.object({
      type: z.literal('deployment-node'),
      id: z.string().describe('Deployment ID (FQN)'),
      kind: z.string(),
      title: z.string(),
      project: z.string().describe('Project name'),
      tags: z.array(z.string()),
    }),
    z.object({
      type: z.literal('deployed-instance'),
      id: z.string().describe('Deployment ID (FQN)'),
      title: z.string(),
      logicalElementId: z.string().describe('Logical element ID (FQN)'),
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
Search for LikeC4 elements and deployments by partial match of:
- id (FQN)
- title
- tags
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
  const search = args.search.toLowerCase()

  const predicate = <E extends { id: string; title: string; kind: string; tags: readonly string[] }>(el: E) =>
    el.id.toLowerCase().includes(search)
    || el.title.toLowerCase().includes(search)
    || isome(el.tags, tag => tag.toLowerCase().includes(search))

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
          project: project.id,
          tags: [...el.tags],
        })
      }

      // filter deployed instances
      for (const el of ifilter(model.deployment.instances(), predicate)) {
        found.push({
          type: 'deployed-instance',
          id: el.id,
          title: el.title,
          logicalElementId: el.element.id,
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

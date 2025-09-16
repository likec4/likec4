import { ifilter, imap, toArray } from '@likec4/core/utils'
import { keys, pipe } from 'remeda'
import z from 'zod'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

export const readProjectElements = likec4Tool({
  name: 'read-project-elements',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read summary of all elements in the project',
  },
  description: `
Request:
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- elementsCount: number — number of elements
- elements: Element[] — list of elements

Element (object) fields:
- id: string — element id (FQN)
- kind: string — element kind
- title: string — element title
- technology: string|null — element technology
- tags: string[] — element tags
- metadataKeys: string[] — defined metadata keys
- views: string[] — list of view IDs where the element is visible
  `,
  inputSchema: {
    project: projectIdSchema,
  },
  outputSchema: {
    count: z.number().describe('Number of elements'),
    elements: z.array(z.object({
      id: z.string(),
      kind: z.string(),
      title: z.string(),
      technology: z.string().nullable(),
      tags: z.array(z.string()),
      metadataKeys: z.array(z.string()).describe('Defined metadata keys'),
      views: z.array(z.string()).describe('List of view IDs where the element is visible'),
    })).describe('List of elements in the project'),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)

  const elements = pipe(
    model.elements(),
    ifilter(e => !e.imported),
    imap(e => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      technology: e.technology,
      tags: [...e.tags],
      metadataKeys: keys(e.getMetadata()),
      views: [...e.views()].map(v => v.id),
    })),
    toArray(),
  )
  return {
    count: elements.length,
    elements,
  }
})

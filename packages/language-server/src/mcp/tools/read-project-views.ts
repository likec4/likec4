import { imap, toArray } from '@likec4/core/utils'
import { pipe } from 'remeda'
import z from 'zod'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

export const readProjectViews = likec4Tool({
  name: 'read-project-views',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read summary of all views in the project',
  },
  description: `
Request:
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- count: number — number of views
- views: View[] — list of views

View (object) fields:
- id: string — view identifier
- title: string|null — view title
- type: "element" | "deployment" | "dynamic" — view type
- tags: string[] — view tags
- elements: string[] — list of element ids visible in the view

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.

  `,
  inputSchema: {
    project: projectIdSchema,
  },
  outputSchema: {
    count: z.number().describe('Number of views'),
    views: z.array(z.object({
      id: z.string(),
      kind: z.enum(['element', 'deployment', 'dynamic']),
      title: z.string().nullable(),
      tags: z.array(z.string()),
      elements: z.array(z.string()).describe('List of element ids visible in the view'),
    })).describe('List of views in the project'),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)

  const views = pipe(
    model.views(),
    imap(v => ({
      id: v.id,
      kind: v._type,
      title: v.title,
      tags: [...v.tags],
      elements: [...v.nodesWithElement()].map(n => n.element.id),
    })),
    toArray(),
  )
  return {
    count: views.length,
    views,
  }
})

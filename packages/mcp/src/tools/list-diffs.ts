import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

const countsSchema = z.object({
  added: z.number(),
  removed: z.number(),
  modified: z.number(),
})

export const listDiffs = likec4Tool({
  name: 'list-diffs',
  description: `
List model diffs (named change sets, "diff" blocks) and the views each diff changes.

Request:
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- diffs: Array of
  - id: string — diff name
  - title: string|null
  - description: string|null
  - added: { elements: number, relations: number }
  - removed: { elements: number, relations: number }
  - modified: { elements: number }
  - views: Array<{ id, title, nodes: { added, removed, modified }, edges: { added, removed, modified } }> — views changed by the diff

Notes:
- Read-only, idempotent, no side effects.
- A diff describes a future state of the model; the model itself stays unchanged until the diff is applied.
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'List model diffs',
  },
  inputSchema: {
    project: projectIdSchema,
  },
  outputSchema: {
    diffs: z.array(z.object({
      id: z.string(),
      title: z.string().nullable(),
      description: z.string().nullable(),
      added: z.object({ elements: z.number(), relations: z.number() }),
      removed: z.object({ elements: z.number(), relations: z.number() }),
      modified: z.object({ elements: z.number() }),
      views: z.array(z.object({
        id: z.string(),
        title: z.string().nullable(),
        nodes: countsSchema,
        edges: countsSchema,
      })),
    })),
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const diffs = await languageServices.modelDiffs.list(projectId)
  return {
    diffs: diffs.map(diff => ({
      ...diff,
      description: diff.description ? ('md' in diff.description ? diff.description.md : diff.description.txt) : null,
    })),
  }
})

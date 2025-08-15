import z from 'zod'
import { likec4Tool } from '../utils'
import { locationSchema, mkLocate, projectIdSchema } from './_common'

export const openView = likec4Tool({
  name: 'open-view',
  description: `
Open a LikeC4 view in the editor's preview panel.

Request:
- viewId: string — view id (name)
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- location: { path: string, range: { start: { line: number, character: number }, end: { line: number, character: number } } } | null — source location of the view if available

Notes:
- Read-only and idempotent with respect to the project model. Triggers a UI action in the editor.
- Only one preview panel can be open at a time.

Example response:
{
  "location": {
    "path": "/abs/path/project/model.c4",
    "range": { "start": { "line": 10, "character": 0 }, "end": { "line": 30, "character": 0 } }
  }
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Open view in preview panel',
  },
  inputSchema: {
    viewId: z.string().describe('View id (name)'),
    project: projectIdSchema,
  },
  outputSchema: {
    location: locationSchema,
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const view = model.findView(args.viewId)

  if (!view) {
    throw new Error(`View with ID '${args.viewId}' not found in project ${projectId}`)
  }
  await languageServices.views.openView(view.id, projectId)

  const locate = mkLocate(languageServices, projectId)
  return {
    location: locate({ view: view.id }),
  }
})

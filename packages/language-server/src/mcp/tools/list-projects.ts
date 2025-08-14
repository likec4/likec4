import z from 'zod'
import { likec4Tool } from '../utils'

export const listProjects = likec4Tool({
  name: 'list-projects',
  description: `
List LikeC4 projects discoverable in the current workspace.

Request:
- No input parameters.

Response (JSON object):
- projects: Project[]

Project (object) fields:
- id: string — stable project identifier
- title: string — human-readable project title
- folder: string — absolute path to the project root
- sources: string[] — absolute file paths of model documents

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.

Example response:
{
  "projects": [
    {
      "id": "docs",
      "title": "Documentation",
      "folder": "/abs/path/to/workspace/docs",
      "sources": [
        "/abs/path/to/workspace/docs/model/contexts.likec4",
        "/abs/path/to/workspace/docs/model/relations.likec4"
      ]
    }
  ]
}
`,
  annotations: {
    readOnlyHint: true,
  },
  outputSchema: {
    projects: z.array(z.object({
      id: z.string(),
      title: z.string(),
      folder: z.string(),
      sources: z.array(z.string()),
    })),
  },
}, async (languageServices) => {
  const projects = await languageServices.projects()
  return {
    projects: projects.map(p => ({
      id: p.id,
      title: p.title,
      folder: p.folder.fsPath,
      sources: p.documents?.map(d => d.fsPath) ?? [],
    })),
  }
})

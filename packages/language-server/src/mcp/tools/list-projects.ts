import z from 'zod'
import { likec4Tool } from '../utils'

export const listProjects = likec4Tool({
  name: 'list-projects',
  description: `
Lists all available LikeC4 projects in the workspace.
Returns array of projects with:
- name: project name (project id)
- folder: project folder
- sources: array of project sources
`,
  annotations: {
    readOnlyHint: true,
  },
  outputSchema: {
    projects: z.array(z.object({
      name: z.string(),
      folder: z.string(),
      sources: z.array(z.string()),
    })),
  },
}, async (languageServices) => {
  const projects = await languageServices.projects()
  return {
    projects: projects.map(p => ({
      name: p.id,
      folder: p.folder.toString(),
      sources: p.documents?.map(d => d.toString()) ?? [],
    })),
  }
})

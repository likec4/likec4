import { invariant } from '@likec4/core'
import { keys } from 'remeda'
import z from 'zod'
import { safeCall } from '../../utils'
import { ProjectsManager } from '../../workspace'
import { likec4Tool } from '../utils'
import { locationSchema } from './_common'

export const readProjectSummary = likec4Tool({
  name: 'read-project-summary',
  annotations: {
    readOnlyHint: true,
  },
  description: `
Searches for LikeC4 project by name in workspace and returns its summary:
- project human readable title
- project folder
- array of the source filenames
- specification:
  - all element kinds
  - all relationship kinds
  - all deployment kinds
  - all tags (used and unused)
  - used metadata keys
- array of the views, where each view:
  - name
  - type ("element", "deployment", "dynamic")
  - title
  `,
  inputSchema: {
    project: z.string().optional().describe('Project name (optional, will use "default" if not specified)'),
  },
  outputSchema: {
    title: z.string(),
    folder: z.string(),
    sources: z.array(z.string()),
    specification: z.object({
      elementKinds: z.array(z.string()),
      relationshipKinds: z.array(z.string()),
      deploymentKinds: z.array(z.string()),
      tags: z.array(z.string()),
      metadataKeys: z.array(z.string()),
    }),
    views: z.array(z.object({
      name: z.string(),
      title: z.string().nullable(),
      type: z.enum(['element', 'deployment', 'dynamic']),
      sourceLocation: locationSchema.nullish(),
    })),
  },
}, async (languageServices, args) => {
  const projectId = args.project ?? ProjectsManager.DefaultProjectId
  const project = languageServices.projects().find(p => p.id === projectId)
  invariant(project, `Project "${projectId}" not found`)
  const model = await languageServices.computedModel(project.id)
  return {
    title: project.title,
    folder: project.folder.toString(),
    sources: project.documents?.map(d => d.toString()) ?? [],
    specification: {
      elementKinds: keys(model.specification.elements),
      relationshipKinds: keys(model.specification.relationships),
      deploymentKinds: keys(model.specification.deployments),
      tags: [...model.tags],
      metadataKeys: model.specification.metadataKeys ?? [],
    },
    views: [...model.views()].map(v => ({
      name: v.id,
      title: v.title,
      type: v.$view._type,
    })),
  }
})

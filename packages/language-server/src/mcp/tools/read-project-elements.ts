import { invariant } from '@likec4/core'
import z from 'zod'
import { safeCall } from '../../utils'
import { ProjectsManager } from '../../workspace'
import { likec4Tool } from '../utils'
import { locationSchema } from './_common'

const elementSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('logical'),
      id: z.string().describe('Element ID (FQN)'),
      kind: z.string(),
      title: z.string(),
      description: z.string().nullish(),
      technology: z.string().nullish(),
      shape: z.string(),
      tags: z.array(z.string()),
      defaultView: z.string().nullish().describe('Name of the default view of this element'),
      sourceLocation: locationSchema.nullish(),
    }),
    z.object({
      type: z.literal('deployment-node'),
      id: z.string().describe('Deployment ID (FQN)'),
      kind: z.string(),
      title: z.string(),
      description: z.string().nullish(),
      technology: z.string().nullish(),
      shape: z.string(),
      tags: z.array(z.string()),
      defaultView: z.string().nullish().describe('Name of the default view of this element'),
      sourceLocation: locationSchema.nullish(),
    }),
  ]),
)

export const readProjectElements = likec4Tool({
  name: 'read-project-elements',
  annotations: {
    readOnlyHint: true,
  },
  description: `
Returns array of all elements in the project:
- type (logical or deployment-node)
- id (FQN)
- kind
- title, description and technology
- shape
- assigned tags
- name of the default view of this element if any (applies to logical elements only)
- source location (where the element is defined, if running in the editor)
`,
  inputSchema: {
    project: z.string().optional().describe('Project name (optional, will use "default" if not specified)'),
  },
  outputSchema: {
    elements: elementSchema,
  },
}, async (languageServices, args) => {
  const projectId = args.project ?? ProjectsManager.DefaultProjectId
  const project = languageServices.projects().find(p => p.id === projectId)
  invariant(project, `Project "${projectId}" not found`)
  const model = await languageServices.computedModel(project.id)

  const elements = [] as z.infer<typeof elementSchema>

  for (const el of model.elements()) {
    elements.push({
      type: 'logical',
      id: el.id,
      title: el.title,
      description: el.description.text,
      technology: el.technology,
      kind: el.kind,
      tags: [...el.tags],
      shape: el.shape,
      defaultView: el.defaultView?.id,
      sourceLocation: safeCall(() => languageServices.locate({ element: el.id, projectId })),
    })
  }

  for (const el of model.deployment.nodes()) {
    elements.push({
      type: 'deployment-node',
      id: el.id,
      title: el.title,
      description: el.description.text,
      technology: el.technology,
      kind: el.kind,
      tags: [...el.tags],
      shape: el.shape,
      sourceLocation: safeCall(() => languageServices.locate({ deployment: el.id, projectId })),
    })
  }

  return {
    elements,
  }
})

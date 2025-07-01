import { invariant } from '@likec4/core'
import z from 'zod'
import { ProjectsManager } from '../../workspace'
import { likec4Tool } from '../utils'

export const readElement = likec4Tool({
  name: 'read-element',
  description: 'Read details about a LikeC4 logical element',
  annotations: {
    readOnlyHint: true,
  },
  inputSchema: {
    id: z.string().describe('Element id (FQN)'),
    project: z.string().optional().describe('Project name (optional, will use "default" if not specified)'),
  },
  outputSchema: {
    id: z.string().describe('Element id (FQN)'),
    kind: z.string().describe('Element kind'),
    name: z.string().describe('Element name'),
    title: z.string(),
    description: z.string().nullish(),
    technology: z.string().nullish(),
    tags: z.array(z.string()),
    project: z.string(),
    metadata: z.record(z.string()),
    shape: z.string(),
    children: z.array(z.string()).describe('Children of this element (Array of FQNs)'),
    defaultView: z.string().nullish().describe('Name of the default view of this element'),
    includedInViews: z.array(z.string()).describe('Views that include this element (Array of view names)'),
    relationships: z.object({
      incoming: z.array(z.object({
        source: z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
        }),
        target: z.string().describe(
          'Target element id (FQN), either this element or nested element, if relationship is indirect',
        ),
        title: z.string().nullish().describe('Relationship title'),
        description: z.string().nullish().describe('Relationship description'),
        technology: z.string().nullish().describe('Relationship technology'),
        tags: z.array(z.string()).describe('Relationship tags'),
      })),
      outgoing: z.array(z.object({
        source: z.string().describe('Source element id (FQN), either this element or nested element'),
        target: z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
        }),
        title: z.string().nullish().describe('Relationship title'),
        description: z.string().nullish().describe('Relationship description'),
        technology: z.string().nullish().describe('Relationship technology'),
        tags: z.array(z.string()).describe('Relationship tags'),
      })),
    }).describe('Relationships of this element (including indirect, incoming/outgoing to/from nested elements)'),
    deployedInstances: z.array(z.string()).describe('Deployed instances of this element (Array of Deployment FQNs)'),
  },
}, async (languageServices, args) => {
  const projectId = args.project ?? ProjectsManager.DefaultProjectId
  const project = languageServices.projects().find(p => p.id === projectId)
  invariant(project, `Project "${projectId}" not found`)
  const model = await languageServices.computedModel(project.id)
  const element = model.findElement(args.id)
  invariant(element, `Element "${args.id}" not found in project "${projectId}"`)
  return {
    id: element.id,
    name: element.name,
    kind: element.kind,
    title: element.title,
    description: element.description.text,
    technology: element.technology,
    tags: [...element.tags],
    project: project.id,
    metadata: element.getMetadata(),
    shape: element.shape,
    children: [...element.children()].map(c => c.id),
    defaultView: element.defaultView?.id,
    includedInViews: [...element.views()].map(v => v.id),
    relationships: {
      incoming: [...element.incoming()].map(r => ({
        source: {
          id: r.source.id,
          title: r.source.title,
          kind: r.source.kind,
        },
        target: r.target.id,
        title: r.title,
        description: r.description.text,
        technology: r.technology,
        tags: [...r.tags],
      })),
      outgoing: [...element.outgoing()].map(r => ({
        source: r.source.id,
        target: {
          id: r.target.id,
          title: r.target.title,
          kind: r.target.kind,
        },
        title: r.title,
        description: r.description.text,
        technology: r.technology,
        tags: [...r.tags],
      })),
    },
    deployedInstances: [...element.deployments()].map(i => i.id),
  }
})

import { invariant } from '@likec4/core'
import z from 'zod'
import { ProjectsManager } from '../../workspace'
import { likec4Tool } from '../utils'

export const readView = likec4Tool({
  name: 'read-view',
  description: 'Read details about a LikeC4 view',
  annotations: {
    readOnlyHint: true,
  },
  inputSchema: {
    id: z.string().describe('View id (name)'),
    project: z.string().optional().describe('Project name (optional, will use "default" if not specified)'),
  },
  outputSchema: {
    id: z.string(),
    type: z.enum(['element', 'deployment', 'dynamic']),
    title: z.string().nullish(),
    description: z.string().nullish(),
    tags: z.array(z.string()),
    project: z.string(),
    elements: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('logical'),
          id: z.string().describe('Element ID (FQN)'),
          kind: z.string().describe('Element kind'),
          title: z.string().describe('Element title'),
        }),
        z.object({
          type: z.literal('deployment-node'),
          id: z.string().describe('Deployment ID (FQN)'),
          kind: z.string().describe('Deployment kind'),
          title: z.string().describe('Deployment title'),
        }),
        z.object({
          type: z.literal('deployed-instance'),
          id: z.string().describe('Deployment ID (FQN)'),
          title: z.string().describe('Deployment title'),
          logicalElementId: z.string().describe('Logical element ID (FQN)'),
        }),
      ]),
    ).describe('Elements in this view'),
    defaultViewOf: z.string().optional().describe('Element ID (FQN) this view is the default view of'),
  },
}, async (languageServices, args) => {
  const projectId = args.project ?? ProjectsManager.DefaultProjectId
  const project = languageServices.projects().find(p => p.id === projectId)
  invariant(project, `Project "${projectId}" not found`)
  const model = await languageServices.computedModel(project.id)
  const view = model.findView(args.id)

  if (!view) {
    throw new Error(`View with ID '${args.id}' not found in project ${project.id}`)
  }
  return {
    id: view.id,
    type: view.$view._type,
    title: view.title,
    description: view.description.text,
    tags: [...view.tags],
    project: project.id,
    elements: [...view.nodes()].flatMap(node => {
      if (node.hasDeployedInstance()) {
        return {
          type: 'deployed-instance',
          id: node.deployment.id,
          title: node.title,
          logicalElementId: node.deployment.element.id,
        }
      }
      if (node.hasDeployment()) {
        return {
          type: 'deployment-node',
          id: node.deployment.id,
          title: node.title,
          kind: node.deployment.kind,
        }
      }
      if (node.hasElement()) {
        return {
          type: 'logical',
          id: node.element.id,
          title: node.title,
          kind: node.element.kind,
        }
      }
      return []
    }),
    viewOf: view.viewOf?.id,
  }
})

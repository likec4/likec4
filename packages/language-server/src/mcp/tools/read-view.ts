import { invariant } from '@likec4/core'
import type { NodeModel } from '@likec4/core/model'
import z from 'zod'
import { safeCall } from '../../utils'
import { ProjectsManager } from '../../workspace'
import { likec4Tool } from '../utils'
import { locationSchema } from './_common'

const modelRef = (node: NodeModel) => {
  if (node.hasElement()) {
    return node.element.id
  }
  if (node.hasDeployment()) {
    return node.deployment.id
  }
  return null
}

export const readView = likec4Tool({
  name: 'read-view',
  description: `
Returns information about LikeC4 view, includes:
- id (view name)
- type (element, deployment, dynamic)
- title, description, tags
- project name this view belongs to
- array of elements included in this view
- array of relationships in this view (source, target, title, description, technology, tags)
- viewOf (element id this view is the default view of)
- source location (if running in the editor)
`.trimStart(),
  annotations: {
    readOnlyHint: true,
  },
  inputSchema: {
    viewId: z.string().describe('View id (name)'),
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
          description: z.string().nullish(),
          technology: z.string().nullish(),
          children: z.array(z.string()),
          shape: z.string().describe('Element shape'),
          tags: z.array(z.string()),
        }),
        z.object({
          type: z.literal('deployment-node'),
          id: z.string().describe('Deployment ID (FQN)'),
          kind: z.string().describe('Deployment kind'),
          title: z.string().describe('Deployment title'),
          description: z.string().nullish(),
          technology: z.string().nullish(),
          children: z.array(z.string()),
          shape: z.string().describe('Deployment shape'),
          tags: z.array(z.string()),
        }),
        z.object({
          type: z.literal('deployed-instance'),
          id: z.string().describe('Deployment ID (FQN)'),
          title: z.string().describe('Deployment title'),
          description: z.string().nullish(),
          technology: z.string().nullish(),
          logicalElementId: z.string().describe('Logical element ID (FQN)'),
          shape: z.string().describe('Deployment shape'),
          tags: z.array(z.string()),
        }),
      ]),
    ).describe('Elements in this view'),
    relationships: z.array(
      z.object({
        source: z.string().describe('Source element ID'),
        target: z.string().describe('Target element ID'),
        title: z.string().nullish(),
        description: z.string().nullish(),
        technology: z.string().nullish(),
        tags: z.array(z.string()),
      }),
    ).describe('Relationships in this view'),
    defaultViewOf: z.string().optional().describe('Element ID (FQN) this view is the default view of'),
    sourceLocation: locationSchema.nullish(),
  },
}, async (languageServices, args) => {
  const projectId = args.project ?? ProjectsManager.DefaultProjectId
  const project = languageServices.projects().find(p => p.id === projectId)
  invariant(project, `Project "${projectId}" not found`)
  const model = await languageServices.computedModel(project.id)
  const view = model.findView(args.viewId)

  if (!view) {
    throw new Error(`View with ID '${args.viewId}' not found in project ${project.id}`)
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
          description: node.description.text,
          technology: node.technology,
          shape: node.shape,
          tags: [...node.tags],
        }
      }
      if (node.hasDeployment()) {
        return {
          type: 'deployment-node',
          id: node.deployment.id,
          title: node.title,
          kind: node.deployment.kind,
          description: node.description.text,
          technology: node.technology,
          shape: node.shape,
          tags: [...node.tags],
          children: [...node.children()].flatMap(c => modelRef(c) ?? []),
        }
      }
      if (node.hasElement()) {
        return {
          type: 'logical',
          id: node.element.id,
          title: node.title,
          kind: node.element.kind,
          description: node.description.text,
          technology: node.technology,
          shape: node.shape,
          tags: [...node.tags],
          children: [...node.children()].flatMap(c => modelRef(c) ?? []),
        }
      }
      return []
    }),
    viewOf: view.viewOf?.id,
    relationships: [...view.edges()].flatMap(r => {
      const source = modelRef(r.source)
      const target = modelRef(r.target)
      return source && target
        ? [{
          source,
          target,
          title: r.label,
          description: r.description.text,
          technology: r.technology,
          tags: [...r.tags],
        }]
        : []
    }),
    sourceLocation: safeCall(() => languageServices.locate({ view: view.id, projectId })),
  }
})

import type { NodeModel } from '@likec4/core/model'
import z from 'zod'
import { likec4Tool } from '../utils'
import { locationSchema, mkLocate, projectIdSchema } from './_common'

const modelRef = (node: NodeModel) => {
  if (node.hasElement()) {
    return node.element.id
  }
  if (node.hasDeployment()) {
    return node.deployment.id
  }
  return null
}

const nodeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('element'),
    id: z.string().describe('Node ID'),
    elementId: z.string().describe('Element ID (FQN)'),
    kind: z.string().describe('Element kind'),
    title: z.string().describe('Node title'),
    description: z.string().nullable(),
    technology: z.string().nullable(),
    children: z.array(z.string()).describe('Children nodes, array of node IDs'),
    shape: z.string().describe('Rendered shape'),
    color: z.string().describe('Rendered color'),
    tags: z.array(z.string()),
  }),
  z.object({
    type: z.literal('deployment-node'),
    id: z.string().describe('Node ID'),
    deploymentId: z.string().describe('Deployment entity ID (FQN)'),
    kind: z.string().describe('Deployment kind'),
    title: z.string().describe('Node title'),
    description: z.string().nullable(),
    technology: z.string().nullable(),
    children: z.array(z.string()).describe('Children nodes, array of node IDs'),
    shape: z.string().describe('Rendered shape'),
    color: z.string().describe('Rendered color'),
    tags: z.array(z.string()),
  }),
  z.object({
    type: z.literal('deployed-instance'),
    id: z.string().describe('Node ID'),
    deploymentId: z.string().describe('Deployment entity ID (FQN)'),
    title: z.string().describe('Node title'),
    description: z.string().nullable(),
    technology: z.string().nullable(),
    referencedElement: z.object({
      id: z.string().describe('Element ID (FQN)'),
      kind: z.string().describe('Element kind'),
      title: z.string().describe('Element title'),
    }),
    shape: z.string().describe('Rendered shape'),
    color: z.string().describe('Rendered color'),
    tags: z.array(z.string()),
  }),
])

export const readView = likec4Tool({
  name: 'read-view',
  description: `
Read detailed information about a LikeC4 view.

Request:
- viewId: string — view id (name)
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- id: string — view id
- type: "element" | "deployment" | "dynamic" — view type
- title: string — view title (falls back to id if not set)
- description: string|null — optional description
- tags: string[] — view tags
- project: string — project id this view belongs to
- nodes: Node[] — nodes included in the view
- edges: Edge[] — relationships between nodes
- sourceLocation: { path: string, range: { start: { line: number, character: number }, end: { line: number, character: number } } } | null — source location if available

Node (discriminated union by "type"):
- type = "element": { id: string, elementId: string, kind: string, title: string, description: string|null, technology: string|null, children: string[], shape: string, color: string, tags: string[] }
- type = "deployment-node": { id: string, deploymentId: string, kind: string, title: string, description: string|null, technology: string|null, children: string[], shape: string, color: string, tags: string[] }
- type = "deployed-instance": { id: string, deploymentId: string, title: string, description: string|null, technology: string|null, referencedElement: { id: string, kind: string, title: string }, shape: string, color: string, tags: string[] }

Edge object:
- { source: string, target: string, label: string|null, description: string|null, technology: string|null, tags: string[] }

Notes:
- Read-only, idempotent, no side effects.

Example response:
{
  "id": "system-overview",
  "type": "element",
  "title": "System Overview",
  "description": null,
  "tags": [],
  "project": "default",
  "nodes": [
    { "type": "logical", "id": "n1", "elementId": "shop.frontend", "kind": "container", "title": "Frontend", "description": null, "technology": "React", "children": [], "shape": "rounded-rectangle", "color": "#2F80ED", "tags": [] }
  ],
  "edges": [
    { "source": "n1", "target": "n2", "label": "calls", "description": null, "technology": "HTTPS", "tags": [] }
  ],
  "sourceLocation": {
    "path": "/abs/path/project/model.c4",
    "range": { "start": { "line": 10, "character": 0 }, "end": { "line": 30, "character": 0 } }
  }
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read view',
  },
  inputSchema: {
    viewId: z.string().describe('View id (name)'),
    project: projectIdSchema,
  },
  outputSchema: {
    id: z.string(),
    type: z.enum(['element', 'deployment', 'dynamic']).describe('View type'),
    title: z.string(),
    description: z.string().nullable(),
    tags: z.array(z.string()),
    project: z.string(),
    nodes: z.array(nodeSchema),
    edges: z.array(
      z.object({
        source: z.string().describe('Source node'),
        target: z.string().describe('Target node'),
        label: z.string().nullable(),
        description: z.string().nullable(),
        technology: z.string().nullable(),
        tags: z.array(z.string()),
      }),
    ).describe('Edge represents relationship between nodes'),
    sourceLocation: locationSchema,
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const project = languageServices.project(projectId)
  const model = await languageServices.computedModel(projectId)
  const view = model.findView(args.viewId)

  if (!view) {
    throw new Error(`View with ID '${args.viewId}' not found in project ${project.id}`)
  }
  const locate = mkLocate(languageServices, project.id)

  return {
    id: view.id,
    type: view.$view._type,
    title: view.title ?? view.id,
    description: view.description.text,
    tags: [...view.tags],
    project: project.id,
    nodes: [...view.nodes()].flatMap((node): z.infer<typeof nodeSchema> | [] => {
      const base = {
        id: node.id,
        title: node.title,
        description: node.description.text,
        technology: node.technology,
        shape: node.shape,
        color: node.color,
        tags: [...node.tags],
      }
      if (node.hasDeployedInstance()) {
        return {
          ...base,
          type: 'deployed-instance',
          deploymentId: node.deployment.id,
          referencedElement: {
            id: node.deployment.element.id,
            kind: node.deployment.element.kind,
            title: node.deployment.element.title,
          },
        }
      }
      if (node.hasDeployment()) {
        return {
          ...base,
          type: 'deployment-node',
          kind: node.deployment.kind,
          deploymentId: node.deployment.id,
          children: [...node.children()].map(c => c.id),
        }
      }
      if (node.hasElement()) {
        return {
          ...base,
          type: 'element',
          elementId: node.element.id,
          kind: node.element.kind,
          children: [...node.children()].flatMap(c => modelRef(c) ?? []),
        }
      }
      return []
    }),
    edges: [...view.edges()].map(r => ({
      source: r.source.id,
      target: r.target.id,
      label: r.label,
      description: r.description.text,
      technology: r.technology,
      tags: [...r.tags],
    })),
    sourceLocation: locate({ view: view.id }),
  }
})

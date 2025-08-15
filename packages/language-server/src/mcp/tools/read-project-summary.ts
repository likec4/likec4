import { keys } from 'remeda'
import z from 'zod'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

export const readProjectSummary = likec4Tool({
  name: 'read-project-summary',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read project summary',
  },
  description: `
Request:
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- title: string — human-readable project title
- folder: string — absolute path to the project root
- sources: string[] — absolute file paths of model documents
- specification: object
  - elementKinds: string[] — all element kinds
  - relationshipKinds: string[] — all relationship kinds
  - deploymentKinds: string[] — all deployment kinds
  - tags: string[] — all tags
  - metadataKeys: string[] — used metadata keys
- elements: Element[] — list of elements
- deployments: Deployment[] — list of deployment entities
- views: View[] — list of views defined in the model

Element (object) fields:
- id: string — element id (FQN)
- kind: string — element kind
- title: string — element title
- tags: string[] — element tags

Deployment (object) fields:
- type = "deployment-node": { id: string, kind: string, title: string, tags: string[] }
- type = "deployed-instance": { id: string, title: string, tags: string[], referencedElementId: string }

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.

Example response:
{
  "title": "Cloud Boutique",
  "folder": "/abs/path/to/workspace/examples/cloud-system",
  "sources": [
    "/abs/path/to/workspace/examples/cloud-system/model.c4"
  ],
  "specification": {
    "elementKinds": ["system", "container", "component"],
    "relationshipKinds": ["uses", "depends-on"],
    "deploymentKinds": ["node", "cluster"],
    "tags": ["public", "internal"],
    "metadataKeys": ["owner", "tier"]
  },
  "elements": [
    {
      "id": "shop.frontend",
      "kind": "component",
      "title": "Frontend",
      "tags": ["public"]
    }
  ],
  "deployments": [
    {
      "type": "deployment-node",
      "id": "k8s.shop.frontend",
      "kind": "cluster",
      "title": "Frontend",
      "tags": []
    }
  ],
  "views": [
    {
      "name": "system-overview",
      "title": "System Overview",
      "type": "element"
    }
  ]
}
  `,
  inputSchema: {
    project: projectIdSchema,
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
    elements: z.array(z.object({
      id: z.string(),
      kind: z.string(),
      title: z.string(),
      tags: z.array(z.string()),
    })).describe('List of elements in the project'),
    deployments: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('deployment-node'),
          id: z.string().describe('Node ID'),
          kind: z.string().describe('Deployment node kind'),
          title: z.string().describe('Node title'),
          tags: z.array(z.string()),
        }),
        z.object({
          type: z.literal('deployed-instance'),
          id: z.string().describe('Node ID'),
          title: z.string().describe('Node title'),
          tags: z.array(z.string()),
          referencedElementId: z.string().describe('Element ID (FQN)'),
        }),
      ]),
    ).describe('List of deployment nodes and deployed instances in the project'),
    views: z.array(z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum(['element', 'deployment', 'dynamic']),
    })),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const project = languageServices.project(projectId)
  const model = await languageServices.computedModel(projectId)

  return {
    title: project.title,
    folder: project.folder.fsPath,
    specification: {
      elementKinds: keys(model.specification.elements),
      relationshipKinds: keys(model.specification.relationships),
      deploymentKinds: keys(model.specification.deployments),
      tags: [...model.tags],
      metadataKeys: model.specification.metadataKeys ?? [],
    },
    elements: [...model.elements()].filter(e => !e.imported).map(e => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      tags: [...e.tags],
    })),
    deployments: [...model.deployment.elements()].map(d => {
      if (d.isInstance()) {
        return ({
          type: 'deployed-instance',
          id: d.id,
          title: d.title,
          tags: [...d.tags],
          referencedElementId: d.element.id,
        })
      }
      return ({
        type: 'deployment-node',
        id: d.id,
        kind: d.kind,
        title: d.title,
        tags: [...d.tags],
      })
    }),
    views: [...model.views()].map(v => ({
      id: v.id,
      title: v.titleOrId,
      type: v.$view._type,
    })),
    sources: project.documents?.map(d => d.fsPath) ?? [],
  }
})

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
  - tags: string[] — all tags (used and unused)
  - metadataKeys: string[] — used metadata keys
- views: View[] — list of views defined in the model

View (object) fields:
- name: string — view identifier
- title: string|null — view title if provided, otherwise null
- type: "element" | "deployment" | "dynamic"
- sourceLocation: object|null|undefined — source location when available

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

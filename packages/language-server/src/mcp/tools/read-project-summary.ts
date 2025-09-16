import { UriUtils } from 'langium'
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
- sources: string[] — file paths of source documents, relative to the project root
- specification: object
  - elementKinds: string[] — all element kinds
  - relationshipKinds: string[] — all relationship kinds
  - deploymentKinds: string[] — all deployment kinds
  - tags: string[] — all tags
  - metadataKeys: string[] — used metadata keys
- elements: number — number of elements
- deployments: number — number of deployment entities
- views: number — number of views defined in the model

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.

Example response:
{
  "title": "Cloud Boutique",
  "folder": "/abs/path/to/workspace/examples/cloud-system",
  "sources": [
    "model.c4"
  ],
  "specification": {
    "elementKinds": ["system", "container", "component"],
    "relationshipKinds": ["uses", "depends-on"],
    "deploymentKinds": ["node", "cluster"],
    "tags": ["public", "internal"],
    "metadataKeys": ["owner", "tier"]
  },
  "elements": 0,
  "deployments": 0,
  "views": 0
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
    elements: z.number().describe('Number of elements in the project'),
    deployments: z.number().describe('Number of deployment nodes and deployed instances in the project'),
    views: z.number().describe('Number of views in the project'),
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
    elements: [...model.elements()].filter(e => !e.imported).length,
    deployments: [...model.deployment.elements()].length,
    views: [...model.views()].length,
    sources: project.documents?.map(d => UriUtils.relative(project.folder, d)) ?? [],
  }
})

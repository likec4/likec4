import { imap, toArray } from '@likec4/core/utils'
import { keys, pipe } from 'remeda'
import z from 'zod'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

export const readProjectDeployments = likec4Tool({
  name: 'read-project-deployments',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read summary of all deployments in the project',
  },
  description: `
Request:
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- nodesCount: number — number of deployment nodes
- instancesCount: number — number of deployed instances
- deploymentNodes: DeploymentNode[] — list of deployment nodes
- deployedInstances: DeployedInstance[] — list of deployed instances

DeploymentNode (object) fields:
- id: string — deployment node id (FQN)
- kind: string — deployment node kind
- title: string — node title
- technology: string|null — node technology
- tags: string[] — node tags
- metadataKeys: string[] — defined metadata keys
- views: string[] — list of view IDs where this node is visible

DeployedInstance (object) fields:
- id: string — deployed instance id (FQN)
- instanceof: string — referenced element id (FQN)
- title: string — instance title
- tags: string[] — instance tags
- metadataKeys: string[] — defined metadata keys
- views: string[] — list of view IDs where this instance is visible

  `,
  inputSchema: {
    project: projectIdSchema,
  },
  outputSchema: {
    nodesCount: z.number().describe('Number of deployment nodes'),
    instancesCount: z.number().describe('Number of deployed instances'),
    deploymentNodes: z.array(z.object({
      id: z.string().describe('Deployment id (FQN)'),
      kind: z.string().describe('Deployment node kind'),
      title: z.string(),
      technology: z.string().nullable(),
      tags: z.array(z.string()),
      metadataKeys: z.array(z.string()).describe('Defined metadata keys'),
      views: z.array(z.string()).describe('List of view IDs where the element is visible'),
    })),
    deployedInstances: z.array(z.object({
      id: z.string().describe('Deployment id (FQN)'),
      instanceof: z.string().describe('Referenced element'),
      title: z.string(),
      tags: z.array(z.string()),
      metadataKeys: z.array(z.string()).describe('Defined metadata keys'),
      views: z.array(z.string()).describe('List of view IDs where the element is visible'),
    })).describe('List of elements in the project'),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)

  const deploymentNodes = pipe(
    model.deployment.nodes(),
    imap(e => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      technology: e.technology,
      tags: [...e.tags],
      metadataKeys: keys(e.getMetadata()),
      views: [...e.views()].map(v => v.id),
    })),
    toArray(),
  )

  const deployedInstances = pipe(
    model.deployment.instances(),
    imap(e => ({
      id: e.id,
      instanceof: e.element.id,
      title: e.title,
      tags: [...e.tags],
      metadataKeys: keys(e.getMetadata()),
      views: [...e.views()].map(v => v.id),
    })),
    toArray(),
  )
  return {
    nodesCount: deploymentNodes.length,
    instancesCount: deployedInstances.length,
    deploymentNodes,
    deployedInstances,
  }
})

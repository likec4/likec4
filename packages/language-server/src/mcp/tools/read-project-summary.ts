import { invariant } from '@likec4/core'
import { keys } from 'remeda'
import z from 'zod'
import { ProjectsManager } from '../../workspace'
import { likec4Tool } from '../utils'

export const readProjectSummary = likec4Tool({
  name: 'read-project-summary',
  annotations: {
    readOnlyHint: true,
  },
  description: `
Searches for LikeC4 project by name in workspace and returns its summary:
- project folder
- array of the source files
- specification:
  - all possible element, relationship and deployment kinds
  - all possible tags
  - all possible metadata keys
- array of the elements from logical model with id (FQN), title, kind, tags, and metadata keys
- array of the views with name, type (element, deployment, dynamic), title and tags
- array of the deployment nodes with id (Deployment FQN), title, node kind, tags, and metadata keys
- array of the deployed instances with id (Deployment FQN), title, logical element id (FQN)

Returns null if project is not found
  `,
  inputSchema: {
    project: z.string().optional().describe('Project name (optional, will use "default" if not specified)'),
  },
  outputSchema: {
    folder: z.string(),
    sources: z.array(z.string()),
    specifications: z.object({
      elementKinds: z.array(z.string()),
      relationshipKinds: z.array(z.string()),
      deploymentKinds: z.array(z.string()),
      tags: z.array(z.string()),
      metadataKeys: z.array(z.string()),
    }),
    elements: z.array(z.object({
      id: z.string(),
      title: z.string(),
      kind: z.string(),
      tags: z.array(z.string()),
      metadataKeys: z.array(z.string()),
    })),
    views: z.array(z.object({
      name: z.string(),
      title: z.string().nullable(),
      type: z.enum(['element', 'deployment', 'dynamic']),
    })),
    deploymentNodes: z.array(z.object({
      id: z.string(),
      title: z.string(),
      kind: z.string(),
      tags: z.array(z.string()),
      metadataKeys: z.array(z.string()),
    })),
    deployedInstances: z.array(z.object({
      id: z.string(),
      title: z.string(),
      logicalElementId: z.string(),
    })),
  },
}, async (languageServices, args) => {
  // const project = await languageServices.projectsManager.getProject((args.project ?? 'default') as scalar.ProjectId)

  const projectId = args.project ?? ProjectsManager.DefaultProjectId
  const project = languageServices.projects().find(p => p.id === projectId)
  invariant(project, `Project "${projectId}" not found`)
  const model = await languageServices.computedModel(project.id)
  return {
    folder: project.folder.toString(),
    sources: project.documents?.map(d => d.toString()) ?? [],
    specifications: {
      elementKinds: keys(model.specification.elements),
      relationshipKinds: keys(model.specification.relationships),
      deploymentKinds: keys(model.specification.deployments),
      tags: [...model.tags],
      metadataKeys: model.specification.metadataKeys ?? [],
    },
    elements: [...model.elements()].map(el => ({
      id: el.id,
      title: el.title,
      kind: el.kind,
      tags: [...el.tags],
      metadataKeys: keys(el.getMetadata()),
    })),
    views: [...model.views()].map(v => ({
      name: v.id,
      title: v.title,
      type: v.$view._type,
    })),
    deploymentNodes: [...model.deployment.nodes()].map(dn => ({
      id: dn.id,
      title: dn.title,
      kind: dn.kind,
      tags: [...dn.tags],
      metadataKeys: keys(dn.getMetadata()),
    })),
    deployedInstances: [...model.deployment.instances()].map(di => ({
      id: di.id,
      title: di.title,
      logicalElementId: di.element.id,
    })),
  }
})

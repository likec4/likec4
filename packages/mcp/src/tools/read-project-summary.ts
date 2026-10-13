// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { keys } from 'remeda'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { projectConfigSchema, projectIdSchema, serializeConfig } from './_common'

export const readProjectSummary = likec4Tool({
  name: 'read-project-summary',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read project summary',
  },
  description:
    `Overview of a LikeC4 project: its configuration, its specification (element, relationship and deployment kinds, tags, metadata keys), and every element, deployment entity and view with id, kind, title and tags. Use it to orient in a project before reading individual elements or views.`,
  inputSchema: {
    project: projectIdSchema,
  },
  outputSchema: {
    title: z.string(),
    folder: z.string(),
    sources: z.array(z.string()),
    config: projectConfigSchema.describe('Project configuration'),
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
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const project = languageServices.project(projectId)
  const model = await languageServices.computedModel(projectId)

  return {
    title: project.title,
    folder: project.folder.fsPath,
    sources: project.documents?.map(d => d.fsPath) ?? [],
    config: serializeConfig(project.config),
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
  }
})

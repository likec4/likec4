// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { NodeModel } from '@likec4/core/model'
import * as z from 'zod/v4'
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
  description:
    `Read a view's structure: its nodes (elements, deployment nodes or deployed instances) and the edges between them, with source location. A view without a title returns its id as the title. Use render-view to show the diagram to the user.`,
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
})(async (languageServices, args) => {
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

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { invariant } from '@likec4/core'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import {
  includedInViews,
  includedInViewsSchema,
  linksSchema,
  locationSchema,
  mkLocate,
  projectIdSchema,
  serializeLinks,
} from './_common'

export const readDeployment = likec4Tool({
  name: 'read-deployment',
  description:
    `Read one deployment node or deployed instance: kind, tags, metadata, links, children (empty for an instance), the views that include it, the element a deployed instance instantiates, and source location.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read deployment entity',
  },
  inputSchema: {
    id: z.string().describe('Deployment id (FQN)'),
    project: projectIdSchema,
  },
  outputSchema: {
    type: z.enum(['deployment-node', 'deployed-instance']),
    id: z.string().describe('Deployment id (FQN)'),
    kind: z.string().describe('Deployment node kind, or element kind for deployed instances'),
    name: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    technology: z.string().nullable(),
    tags: z.array(z.string()),
    project: z.string(),
    metadata: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
    links: linksSchema.describe('External links associated with this deployment entity'),
    shape: z.string(),
    color: z.string(),
    children: z.array(z.string()).describe('Children of this deployment node (Array of Deployment ids)'),
    includedInViews: includedInViewsSchema.describe('Views that include this deployment node'),
    instanceof: z.object({
      id: z.string().describe('Element ID (FQN)'),
      title: z.string(),
      kind: z.string(),
    }).nullable().describe('If type is "deployed-instance", the referenced element'),
    sourceLocation: locationSchema,
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const element = model.deployment.findElement(args.id)
  invariant(element, `Deployment entity "${args.id}" not found in project "${projectId}"`)

  const locate = mkLocate(languageServices, projectId)

  return {
    type: element.isInstance() ? 'deployed-instance' : 'deployment-node',
    id: element.id,
    name: element.name,
    kind: element.kind,
    title: element.title,
    description: element.description.text,
    technology: element.technology,
    tags: [...element.tags],
    project: projectId,
    metadata: element.getMetadata(),
    links: serializeLinks(element),
    shape: element.shape,
    color: element.color,
    children: element.isInstance() ? [] : [...element.children()].map(c => c.id),
    includedInViews: includedInViews(element.views()),
    instanceof: element.isInstance()
      ? {
        id: element.element.id,
        title: element.element.title,
        kind: element.element.kind,
      }
      : null,
    sourceLocation: locate({ deployment: element.id }),
  }
})

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

export const readElement = likec4Tool({
  name: 'read-element',
  description:
    `Read one element in full: properties, metadata, links, children, the views that include it, its direct and indirect incoming and outgoing relationships, deployed instances and source location. For many elements, use batch-read-elements.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read element',
  },
  inputSchema: {
    id: z.string().describe('Element id (FQN)'),
    project: projectIdSchema,
  },
  outputSchema: {
    id: z.string().describe('Element id (FQN)'),
    kind: z.string().describe('Element kind'),
    name: z.string().describe('Element name'),
    title: z.string(),
    description: z.string().nullable(),
    technology: z.string().nullable(),
    tags: z.array(z.string()),
    project: z.string(),
    metadata: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
    links: linksSchema,
    shape: z.string(),
    color: z.string(),
    children: z.array(z.string()).describe('Children of this element (Array of FQNs)'),
    defaultView: z.string().nullable().describe('Name of the default view of this element'),
    includedInViews: includedInViewsSchema.describe('Views that include this element'),
    relationships: z.object({
      incoming: z.array(z.object({
        source: z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
        }).describe('Source element of this relationship'),
        kind: z.string().nullable().describe('Relationship kind'),
        target: z.string().describe(
          'Target element id (FQN), either this element or nested element, if relationship is indirect',
        ),
        title: z.string().nullable().describe('Relationship title'),
        description: z.string().nullable().describe('Relationship description'),
        technology: z.string().nullable().describe('Relationship technology'),
        tags: z.array(z.string()).describe('Relationship tags'),
      })).describe('Incoming relationships of this element (direct and indirect, incoming to nested elements)'),
      outgoing: z.array(z.object({
        source: z.string().describe(
          'Source element id (FQN), either this element or nested element, if relationship is indirect',
        ),
        target: z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
        }).describe('Target element of this relationship'),
        kind: z.string().nullable().describe('Relationship kind'),
        title: z.string().nullable().describe('Relationship title'),
        description: z.string().nullable().describe('Relationship description'),
        technology: z.string().nullable().describe('Relationship technology'),
        tags: z.array(z.string()).describe('Relationship tags'),
      })).describe('Outgoing relationships of this element (direct and indirect, outgoing from nested elements)'),
    }).describe('Relationships of this element'),
    deployedInstances: z.array(z.string()).describe('Deployed instances of this element (Array of Deployment FQNs)'),
    sourceLocation: locationSchema,
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const element = model.findElement(args.id)
  invariant(element, `Element "${args.id}" not found in project "${projectId}"`)

  const locate = mkLocate(languageServices, projectId)

  return {
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
    children: [...element.children()].map(c => c.id),
    defaultView: element.defaultView?.id || null,
    includedInViews: includedInViews(element.views()),
    relationships: {
      incoming: [...element.incoming()].map(r => ({
        source: {
          id: r.source.id,
          title: r.source.title,
          kind: r.source.kind,
        },
        kind: r.kind,
        target: r.target.id,
        title: r.title,
        description: r.description.text,
        technology: r.technology,
        tags: [...r.tags],
      })),
      outgoing: [...element.outgoing()].map(r => ({
        source: r.source.id,
        target: {
          id: r.target.id,
          title: r.target.title,
          kind: r.target.kind,
        },
        kind: r.kind,
        title: r.title,
        description: r.description.text,
        technology: r.technology,
        tags: [...r.tags],
      })),
    },
    deployedInstances: [...element.deployments()].map(i => i.id),
    sourceLocation: locate({ element: element.id }),
  }
})

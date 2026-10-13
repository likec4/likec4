// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { modelConnection } from '@likec4/core/model'
import { invariant, isSameHierarchy } from '@likec4/core/utils'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { includedInViews, includedInViewsSchema, locationSchema, mkLocate, projectIdSchema } from './_common'

const endpointSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
})

const searchResultSchema = z.object({
  type: z.enum(['direct', 'indirect']).describe(
    'Type of relationship, "direct" for direct relationships, "indirect" for relationships through nested elements',
  ),
  source: endpointSchema,
  target: endpointSchema,
  kind: z.string().nullable().describe('Relationship kind'),
  title: z.string().nullable().describe('Relationship title'),
  description: z.string().nullable().describe('Relationship description'),
  technology: z.string().nullable().describe('Relationship technology'),
  tags: z.array(z.string()).describe('Relationship tags'),
  includedInViews: includedInViewsSchema.describe('Views that include this relationship'),
  sourceLocation: locationSchema,
})

export const findRelationships = likec4Tool({
  name: 'find-relationships',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Find relationships between two elements',
  },
  description:
    `Find the relationships between two elements: direct ones between them, and indirect ones through their nested elements. Each comes with kind, title, technology, tags, the views it appears in and source location. Result order is not guaranteed. For multi-hop chains, use find-relationship-paths.`,
  inputSchema: {
    element1: z.string().describe('Element ID (FQN)'),
    element2: z.string().describe('Element ID (FQN)'),
    project: projectIdSchema,
  },
  outputSchema: {
    found: z.array(searchResultSchema),
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  if (isSameHierarchy(args.element1, args.element2)) {
    throw new Error('No relationships possible between parent-child')
  }

  const found = [] as z.infer<typeof searchResultSchema>[]
  const model = await languageServices.computedModel(projectId)

  const el1 = model.findElement(args.element1)
  invariant(el1, `Element "${args.element1}" not found in project "${projectId}"`)
  const el2 = model.findElement(args.element2)
  invariant(el2, `Element "${args.element2}" not found in project "${projectId}"`)

  const locate = mkLocate(languageServices, projectId)

  const relationships = modelConnection.findConnection(el1, el2, 'both').flatMap(c => [...c.relations])

  for (const relationship of relationships) {
    const isDirect = (relationship.source === el1 && relationship.target === el2)
      || (relationship.source === el2 && relationship.target === el1)

    found.push({
      type: isDirect ? 'direct' : 'indirect',
      source: {
        id: relationship.source.id,
        title: relationship.source.title,
        kind: relationship.source.kind,
      },
      target: {
        id: relationship.target.id,
        title: relationship.target.title,
        kind: relationship.target.kind,
      },
      kind: relationship.kind,
      title: relationship.title,
      description: relationship.description.text,
      technology: relationship.technology,
      tags: [...relationship.tags],
      includedInViews: includedInViews(relationship.views()),
      sourceLocation: locate({ relation: relationship.id }),
    })
  }

  return {
    found,
  }
})

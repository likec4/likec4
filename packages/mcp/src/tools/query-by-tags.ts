// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import { isDeploymentNodeModel } from '@likec4/core/model'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { type ElementSummary, elementSummarySchema, projectIdSchema, serializeElement } from './_common'

export const queryByTags = likec4Tool({
  name: 'query-by-tags',
  description:
    `Find elements and deployment nodes by tags with boolean logic: allOf (AND), anyOf (OR) and noneOf (NOT), combined with AND. At least one condition is required, and tags are case-sensitive. At most 50 results. For partial tag names, use query-by-tag-pattern.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Query by tags',
  },
  inputSchema: {
    allOf: z.array(z.string()).optional().describe('Element must have ALL these tags (AND)'),
    anyOf: z.array(z.string()).optional().describe('Element must have ANY of these tags (OR)'),
    noneOf: z.array(z.string()).optional().describe('Element must have NONE of these tags (NOT)'),
    project: projectIdSchema,
  },
  outputSchema: {
    results: z.array(elementSummarySchema),
    truncated: z.boolean().describe('True if results were truncated due to exceeding the 50-result limit'),
  },
})(async (languageServices, args) => {
  invariant(
    (args.allOf && args.allOf.length > 0) ||
      (args.anyOf && args.anyOf.length > 0) ||
      (args.noneOf && args.noneOf.length > 0),
    'At least one condition (allOf, anyOf, or noneOf) must be specified with at least one tag',
  )

  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)

  const results: ElementSummary[] = []
  const limit = 50
  let truncated = false

  const matchesTags = (tags: Iterable<string>): boolean => {
    const tagSet = tags instanceof Set ? tags : new Set(tags)
    if (args.allOf && args.allOf.length > 0) {
      if (!args.allOf.every(tag => tagSet.has(tag))) return false
    }
    if (args.anyOf && args.anyOf.length > 0) {
      if (!args.anyOf.some(tag => tagSet.has(tag))) return false
    }
    if (args.noneOf && args.noneOf.length > 0) {
      if (args.noneOf.some(tag => tagSet.has(tag))) return false
    }
    return true
  }

  for (const element of model.elements()) {
    if (results.length >= limit) {
      truncated = true
      break
    }
    if (matchesTags(element.tags)) {
      results.push(serializeElement(element))
    }
  }

  if (!truncated) {
    for (const deploymentElement of model.deployment.elements()) {
      if (results.length >= limit) {
        truncated = true
        break
      }
      if (!isDeploymentNodeModel(deploymentElement)) continue
      if (matchesTags(deploymentElement.tags)) {
        results.push(serializeElement(deploymentElement))
      }
    }
  }

  return { results, truncated }
})

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { isDeploymentNodeModel } from '@likec4/core/model'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { elementSummarySchema, projectIdSchema, serializeElement } from './_common'

const MAX_RESULTS = 50

export const queryByTagPattern = likec4Tool({
  name: 'query-by-tag-pattern',
  description:
    `Find elements whose tags match a pattern, for structured tag naming such as "team_*". matchMode is "prefix" (default), "contains" or "suffix", case-insensitive. Returns the matching tags per element and every distinct matching tag. At most 50 results. For exact tags with boolean logic, use query-by-tags.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Query by tag pattern',
  },
  inputSchema: {
    pattern: z.string().min(1).describe('Tag pattern to match'),
    matchMode: z.enum(['prefix', 'contains', 'suffix']).optional().default('prefix').describe(
      'Pattern matching mode (default: prefix)',
    ),
    project: projectIdSchema,
  },
  outputSchema: {
    results: z.array(elementSummarySchema.extend({
      matchedTags: z.array(z.string()).describe('Tags that matched the pattern'),
    })),
    truncated: z.boolean().describe('True if results were truncated'),
    matchedTagValues: z.array(z.string()).describe('All unique tag values matching the pattern across all elements'),
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const patternLower = args.pattern.toLowerCase()

  const matchesTag = (tag: string): boolean => {
    const tagLower = tag.toLowerCase()
    switch (args.matchMode) {
      case 'prefix':
        return tagLower.startsWith(patternLower)
      case 'contains':
        return tagLower.includes(patternLower)
      case 'suffix':
        return tagLower.endsWith(patternLower)
    }
  }

  const results: Array<z.infer<typeof elementSummarySchema> & { matchedTags: string[] }> = []
  let truncated = false
  const allMatchedTags = new Set<string>()

  for (const element of model.elements()) {
    const tags = [...element.tags]
    const matched = tags.filter(matchesTag)
    if (matched.length > 0) {
      matched.forEach(t => allMatchedTags.add(t))
      if (results.length >= MAX_RESULTS) {
        truncated = true
        continue // Continue to collect all matchedTagValues
      }
      results.push({
        ...serializeElement(element),
        matchedTags: matched,
      })
    }
  }

  for (const deploymentElement of model.deployment.elements()) {
    if (!isDeploymentNodeModel(deploymentElement)) continue
    const tags = [...deploymentElement.tags]
    const matched = tags.filter(matchesTag)
    if (matched.length > 0) {
      matched.forEach(t => allMatchedTags.add(t))
      if (results.length >= MAX_RESULTS) {
        truncated = true
        continue
      }
      results.push({
        ...serializeElement(deploymentElement),
        matchedTags: matched,
      })
    }
  }

  return {
    results,
    truncated,
    matchedTagValues: [...allMatchedTags].sort((a, b) => a.localeCompare(b)),
  }
})

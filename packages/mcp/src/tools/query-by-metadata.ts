// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { elementSummarySchema, projectIdSchema, serializeElement } from './_common'

const matchModeSchema = z.enum(['exact', 'contains', 'exists'])

export const queryByMetadata = likec4Tool({
  name: 'query-by-metadata',
  description:
    `Find elements and deployment nodes by metadata. matchMode "exact" (default) compares the value case-sensitively, "contains" matches a substring case-insensitively, and "exists" matches any element with the key and ignores value. An array value matches if any item matches. At most 50 results.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Query by metadata',
  },
  inputSchema: {
    key: z.string().describe('Metadata key to filter by'),
    value: z.string().optional().describe('Metadata value to match (ignored for exists mode)'),
    matchMode: matchModeSchema.optional().default('exact').describe('Matching mode'),
    project: projectIdSchema,
  },
  outputSchema: {
    results: z.array(elementSummarySchema.extend({
      matchedValue: z.string().describe('The metadata value that matched'),
    })),
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const matchMode = args.matchMode

  const results = []
  const limit = 50

  type MatchMode = typeof matchMode
  const matches = (metadataValue: string | string[], searchValue: string | undefined, mode: MatchMode): boolean => {
    const values = Array.isArray(metadataValue) ? metadataValue : [metadataValue]

    switch (mode) {
      case 'exists':
        return true
      case 'exact':
        if (searchValue === undefined) return false
        return values.some(v => v === searchValue)
      case 'contains': {
        if (searchValue === undefined) return false
        const searchLower = searchValue.toLowerCase()
        return values.some(v => v.toLowerCase().includes(searchLower))
      }
      default:
        return false
    }
  }

  const getMatchedValue = (
    metadataValue: string | string[],
    searchValue: string | undefined,
    mode: MatchMode,
  ): string => {
    const values = Array.isArray(metadataValue) ? metadataValue : [metadataValue]

    if (mode === 'exists' || searchValue === undefined) {
      return values[0] || ''
    }
    if (mode === 'exact') {
      return values.find(v => v === searchValue) || values[0] || ''
    }
    if (mode === 'contains') {
      const searchLower = searchValue.toLowerCase()
      return values.find(v => v.toLowerCase().includes(searchLower)) || values[0] || ''
    }
    return values[0] || ''
  }

  for (const element of model.elements()) {
    if (results.length >= limit) break
    const metadata = element.getMetadata()
    if (args.key in metadata) {
      const metadataValue = metadata[args.key]
      if (metadataValue !== undefined && matches(metadataValue, args.value, matchMode)) {
        results.push({
          ...serializeElement(element),
          matchedValue: getMatchedValue(metadataValue, args.value, matchMode),
        })
      }
    }
  }

  if (results.length < limit) {
    for (const deploymentElement of model.deployment.elements()) {
      if (results.length >= limit) break
      const metadata = deploymentElement.getMetadata()
      if (args.key in metadata) {
        const metadataValue = metadata[args.key]
        if (metadataValue !== undefined && matches(metadataValue, args.value, matchMode)) {
          results.push({
            ...serializeElement(deploymentElement),
            matchedValue: getMatchedValue(metadataValue, args.value, matchMode),
          })
        }
      }
    }
  }

  return { results }
})

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { elementSummarySchema, projectIdSchema, serializeElement } from './_common'

const matchModeSchema = z.enum(['exact', 'contains', 'exists'])

export const queryByMetadata = likec4Tool({
  name: 'query-by-metadata',
  description: `
Search elements and deployment nodes by metadata key-value pairs with flexible matching modes.

Request:
- key: string — metadata key to filter by
- value: string (optional) — metadata value to match (ignored for 'exists' mode)
- matchMode: "exact" | "contains" | "exists" (optional, default: "exact")
- project: string (optional) — project id. Defaults to "default" if omitted.

Match Modes:
- exact: Value must match exactly (case-sensitive)
  Example: key="owner", value="platform-team" matches only exact "platform-team"
- contains: Value contains the search string (case-insensitive)
  Example: key="technology", value="aws" matches "AWS Lambda", "aws-s3", etc.
- exists: Element has the key (value parameter is ignored)
  Example: key="owner" returns all elements with any "owner" metadata

Response (JSON object):
- results: Array of matching elements/deployment-nodes, each with:
  - id: string — element/node id (FQN)
  - name: string — element/node name
  - kind: string — element/node kind
  - title: string — human-readable title
  - tags: string[] — assigned tags
  - metadata: Record<string, string | string[]> — all element metadata
  - matchedValue: string — the metadata value that matched (for reference)
  - includedInViews: View[] — views that include this element

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.
- Handles both string and array metadata values.
- For array values, matches if any element in the array matches.
- Returns empty array if no matches found.
- Limited to 50 results to avoid overwhelming responses.
- Case-sensitive for exact mode, case-insensitive for contains mode.

Example response:
{
  "results": [
    {
      "id": "shop.frontend",
      "name": "frontend",
      "kind": "container",
      "title": "Frontend",
      "tags": ["public"],
      "metadata": {
        "owner": "platform-team",
        "tier": "critical"
      },
      "matchedValue": "platform-team",
      "includedInViews": [
        {
          "id": "system-overview",
          "title": "System Overview",
          "type": "element"
        }
      ]
    }
  ]
}
`,
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
}, async (languageServices, args) => {
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

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import { isDeploymentNodeModel } from '@likec4/core/model'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { type ElementSummary, elementSummarySchema, projectIdSchema, serializeElement } from './_common'

export const queryByTags = likec4Tool({
  name: 'query-by-tags',
  description: `
Advanced tag filtering with boolean logic (AND, OR, NOT).

Request:
- allOf: string[] (optional) — element must have ALL these tags (AND logic)
- anyOf: string[] (optional) — element must have ANY of these tags (OR logic)
- noneOf: string[] (optional) — element must have NONE of these tags (NOT logic)
- project: string (optional) — project id. Defaults to "default" if omitted.

Boolean Logic:
- All three conditions are combined with AND logic
- At least one condition must be specified
- Tags are case-sensitive

Example Queries:
- Public APIs: {"allOf": ["public", "api"]}
- Deprecated or legacy: {"anyOf": ["deprecated", "legacy"]}
- Public but not deprecated: {"allOf": ["public"], "noneOf": ["deprecated"]}
- Critical services not in migration: {"allOf": ["critical", "service"], "noneOf": ["migration", "deprecated"]}

Response (JSON object):
- results: Array of matching elements/deployment-nodes, each with:
  - id: string — element/node id (FQN)
  - name: string — element/node name
  - kind: string — element/node kind
  - title: string — human-readable title
  - tags: string[] — assigned tags (for reference)
  - metadata: Record<string, string | string[]> — element metadata
  - includedInViews: View[] — views that include this element

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.
- Returns empty array if no matches found.
- Limited to 50 results to avoid overwhelming responses.
- Conflicting conditions (e.g., allOf and noneOf with same tag) will return no results.

Example response:
{
  "results": [
    {
      "id": "shop.api",
      "name": "api",
      "kind": "container",
      "title": "API Gateway",
      "tags": ["public", "api", "critical"],
      "metadata": {
        "owner": "platform-team"
      },
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
}, async (languageServices, args) => {
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

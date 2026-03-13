// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { isDeploymentNodeModel } from '@likec4/core/model'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { elementSummarySchema, projectIdSchema, serializeElement } from './_common'

const MAX_RESULTS = 50

export const queryByTagPattern = likec4Tool({
  name: 'query-by-tag-pattern',
  description: `
Search elements by tag patterns using prefix or substring matching.
Useful for tag taxonomies with structured naming conventions (e.g., "schedule_*", "*_asil_*").

Request:
- pattern: string — tag pattern to match
- matchMode: "prefix" | "contains" | "suffix" (optional, default: "prefix")
  - prefix: matches tags starting with the pattern (e.g., "target_asil" matches "target_asil_qm", "target_asil_asil_b")
  - contains: matches tags containing the pattern anywhere (e.g., "asil" matches "target_asil_qm", "unit_asil_b")
  - suffix: matches tags ending with the pattern (e.g., "_tbc" matches "target_asil_qm__tbc")
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- results: Array of matching elements, each with:
  - id: string — element id (FQN)
  - name: string — element name
  - kind: string — element kind
  - title: string — human-readable title
  - tags: string[] — all assigned tags
  - metadata: Record<string, string | string[]> — element metadata
  - matchedTags: string[] — the specific tags that matched the pattern
  - includedInViews: View[] — views that include this element
- truncated: boolean — true if results were truncated due to exceeding the 50-result limit
- matchedTagValues: string[] — all unique tag values that matched the pattern across all elements

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.
- Pattern matching is case-insensitive.
- Returns empty array if no matches found.
- Limited to 50 results.
- matchedTagValues provides a summary of all distinct matching tag values found.

Example response:
{
  "results": [
    {
      "id": "top.planner.behaviorNode",
      "name": "behaviorNode",
      "kind": "cgf-node",
      "title": "behaviorNode :dwBehaviorPlannerNode",
      "tags": ["is_in_dag", "target_asil_qm", "process_camera_master"],
      "metadata": {},
      "matchedTags": ["target_asil_qm"],
      "includedInViews": []
    }
  ],
  "truncated": false,
  "matchedTagValues": ["target_asil_qm", "target_asil_asil_b", "target_asil_qm__tbc"]
}
`,
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
}, async (languageServices, args) => {
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

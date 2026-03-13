// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { type ElementSummary, elementSummarySchema, projectIdSchema, serializeElement } from './_common'

const queryTypeSchema = z.enum([
  'ancestors',
  'descendants',
  'siblings',
  'children',
  'parent',
  'incomers',
  'outgoers',
])

const MAX_RESULTS = 100

export const queryGraph = likec4Tool({
  name: 'query-graph',
  description: `
Query element hierarchy and relationships in the architecture graph.

Request:
- elementId: string — element id (FQN) to query
- queryType: "ancestors" | "descendants" | "siblings" | "children" | "parent" | "incomers" | "outgoers"
- includeIndirect: boolean (optional, default: true) — for incomers/outgoers, include indirect relationships (through nested elements)
- project: string (optional) — project id. Defaults to "default" if omitted.

Query Types:
- ancestors: Returns all parent elements up to the root (hierarchical)
  Example: shop.frontend.auth.service returns [shop.frontend.auth, shop.frontend, shop]
- descendants: Returns all child elements recursively (hierarchical)
  Example: shop.frontend returns all nested elements like shop.frontend.auth, shop.frontend.auth.service
- siblings: Returns elements at the same hierarchy level with the same parent
  Example: shop.frontend returns [shop.backend, shop.database] if they're siblings
- children: Returns direct child elements only (not recursive)
  Example: shop returns [shop.frontend, shop.backend] but not shop.frontend.auth
- parent: Returns the direct parent element
  Example: shop.frontend.auth returns shop.frontend
- incomers: Returns elements that have outgoing relationships to this element (single hop, not recursive).
  For recursive upstream traversal, use query-incomers-graph instead.
  includeIndirect=true: Includes relationships to nested children
  Example: Elements that depend on this element
- outgoers: Returns elements that receive incoming relationships from this element (single hop, not recursive).
  For recursive downstream traversal, use query-outgoers-graph instead.
  includeIndirect=true: Includes relationships from nested children
  Example: Elements this element depends on

Response (JSON object):
- results: Array of elements (max 100), each with:
  - id: string — element id (FQN)
  - name: string — element name
  - kind: string — element kind
  - title: string — human-readable title
  - tags: string[] — assigned tags
  - metadata: Record<string, string> — element metadata
  - includedInViews: View[] — views that include this element
- truncated: boolean — true if results were truncated due to exceeding maximum limit (100)

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.
- For parent query on root element, returns empty array.
- For hierarchical queries (ancestors, descendants, siblings, children), includeIndirect is ignored.

Example response:
{
  "results": [
    {
      "id": "shop.frontend",
      "name": "frontend",
      "kind": "container",
      "title": "Frontend",
      "tags": ["public"],
      "metadata": { "owner": "web-team" },
      "includedInViews": [
        {
          "id": "system-overview",
          "title": "System Overview",
          "type": "element"
        }
      ]
    }
  ],
  "truncated": false
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Query element graph',
  },
  inputSchema: {
    elementId: z.string().describe('Element id (FQN) to query'),
    queryType: queryTypeSchema.describe('Type of graph query'),
    includeIndirect: z.boolean().optional().default(true).describe(
      'For incomers/outgoers: include indirect relationships (default: true)',
    ),
    project: projectIdSchema,
  },
  outputSchema: {
    results: z.array(elementSummarySchema),
    truncated: z.boolean().describe('True if results were truncated due to exceeding maximum limit'),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const element = model.findElement(args.elementId)
  invariant(element, `Element "${args.elementId}" not found in project "${projectId}"`)

  const results: ElementSummary[] = []
  let truncated = false

  switch (args.queryType) {
    case 'ancestors': {
      for (const ancestor of element.ancestors()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(ancestor))
      }
      break
    }

    case 'descendants': {
      for (const descendant of element.descendants()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(descendant))
      }
      break
    }

    case 'siblings': {
      for (const sibling of element.siblings()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(sibling))
      }
      break
    }

    case 'children': {
      for (const child of element.children()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(child))
      }
      break
    }

    case 'parent': {
      const parent = element.parent
      if (parent) {
        results.push(serializeElement(parent))
      }
      break
    }

    case 'incomers': {
      const filter = args.includeIndirect ? 'all' : 'direct'
      for (const incomer of element.incomers(filter)) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(incomer))
      }
      break
    }

    case 'outgoers': {
      const filter = args.includeIndirect ? 'all' : 'direct'
      for (const outgoer of element.outgoers(filter)) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(outgoer))
      }
      break
    }
  }

  return { results, truncated }
})

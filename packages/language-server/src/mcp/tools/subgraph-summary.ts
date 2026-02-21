// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

const MAX_RESULTS = 200

const descendantSummarySchema = z.object({
  id: z.string().describe('Element id (FQN)'),
  name: z.string().describe('Element name'),
  kind: z.string().describe('Element kind'),
  title: z.string().describe('Human-readable title'),
  depth: z.number().describe('Depth relative to the root element (1 = direct child)'),
  tags: z.array(z.string()).describe('Assigned tags'),
  metadata: z.record(z.union([z.string(), z.array(z.string())])).describe('Element metadata'),
  childCount: z.number().describe('Number of direct children'),
  incomingCount: z.number().describe('Number of incoming relationships'),
  outgoingCount: z.number().describe('Number of outgoing relationships'),
})

export const subgraphSummary = likec4Tool({
  name: 'subgraph-summary',
  description: `
Get a compact, table-friendly summary of all descendants of a parent element.
Returns each descendant with its depth, metadata, tags, and relationship counts in a single call.
Much more efficient than calling read-element for each descendant individually.

Request:
- elementId: string — parent element id (FQN) whose descendants to summarize
- maxDepth: number (optional, default: 10, max: 20) — maximum depth of descendants to include
- metadataKeys: string[] (optional) — if provided, only include these metadata keys in the response (reduces response size)
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- root: object — the root element summary
  - id: string — element id
  - kind: string — element kind
  - title: string — element title
  - childCount: number — number of direct children
- descendants: Array of descendant summaries, each with:
  - id: string — element id (FQN)
  - name: string — element name
  - kind: string — element kind
  - title: string — human-readable title
  - depth: number — depth relative to root (1 = direct child)
  - tags: string[] — assigned tags
  - metadata: Record<string, string | string[]> — element metadata (filtered by metadataKeys if provided)
  - childCount: number — number of direct children
  - incomingCount: number — number of incoming relationships
  - outgoingCount: number — number of outgoing relationships
- totalDescendants: number — total number of descendants (may differ from array length if truncated)
- truncated: boolean — true if results were truncated due to exceeding the 200-result limit
- truncatedByDepth: boolean — true if deeper descendants exist beyond maxDepth

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.
- Limited to 200 descendants in the response.
- Use metadataKeys to reduce response size when you only need specific metadata.
- Descendants are returned in breadth-first order (closest to root first).
- depth=1 means direct child, depth=2 means grandchild, etc.

Example response:
{
  "root": {
    "id": "top.planner",
    "kind": "subsystem",
    "title": "Planner Subsystem",
    "childCount": 5
  },
  "descendants": [
    {
      "id": "top.planner.nodeA",
      "name": "nodeA",
      "kind": "cgf-node",
      "title": "nodeA :dwNodeTypeA",
      "depth": 1,
      "tags": ["is_in_dag", "target_asil_qm"],
      "metadata": { "target_asil": "QM", "safety_info_unit_asil": "QM" },
      "childCount": 0,
      "incomingCount": 3,
      "outgoingCount": 2
    }
  ],
  "totalDescendants": 5,
  "truncated": false,
  "truncatedByDepth": false
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Subgraph summary',
  },
  inputSchema: {
    elementId: z.string().describe('Parent element id (FQN) whose descendants to summarize'),
    maxDepth: z.number().int().min(1).max(20).optional().default(10).describe(
      'Maximum depth of descendants to include (default: 10, max: 20)',
    ),
    metadataKeys: z.array(z.string()).optional().describe(
      'If provided, only include these metadata keys in the response',
    ),
    project: projectIdSchema,
  },
  outputSchema: {
    root: z.object({
      id: z.string(),
      kind: z.string(),
      title: z.string(),
      childCount: z.number(),
    }),
    descendants: z.array(descendantSummarySchema),
    totalDescendants: z.number().describe('Total number of descendants found'),
    truncated: z.boolean().describe('True if results were truncated due to exceeding the limit'),
    truncatedByDepth: z.boolean().describe('True if deeper descendants exist beyond maxDepth'),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)

  const rootElement = model.findElement(args.elementId)
  invariant(rootElement, `Element "${args.elementId}" not found in project "${projectId}"`)

  const maxDepth = args.maxDepth
  const metadataFilter = args.metadataKeys

  const descendants: z.infer<typeof descendantSummarySchema>[] = []
  let totalDescendants = 0
  let truncated = false
  let truncatedByDepth = false

  // BFS traversal
  const queue: Array<{ element: typeof rootElement; depth: number }> = []

  // Seed with direct children
  const rootChildren = [...rootElement.children()]
  for (const child of rootChildren) {
    queue.push({ element: child, depth: 1 })
  }

  while (queue.length > 0) {
    const { element, depth } = queue.shift()!

    if (depth > maxDepth) {
      truncatedByDepth = true
      continue
    }

    totalDescendants++

    const children = [...element.children()]

    if (descendants.length < MAX_RESULTS) {
      const fullMetadata = element.getMetadata()
      const metadata = metadataFilter
        ? Object.fromEntries(metadataFilter.filter(k => k in fullMetadata).map(k => [k, fullMetadata[k]!]))
        : fullMetadata

      descendants.push({
        id: element.id,
        name: element.name,
        kind: element.kind,
        title: element.title,
        depth,
        tags: [...element.tags],
        metadata,
        childCount: children.length,
        incomingCount: [...element.incoming()].length,
        outgoingCount: [...element.outgoing()].length,
      })
    } else {
      truncated = true
    }

    // Enqueue children for next depth level
    for (const child of children) {
      queue.push({ element: child, depth: depth + 1 })
    }
  }

  return {
    root: {
      id: rootElement.id,
      kind: rootElement.kind,
      title: rootElement.title,
      childCount: rootChildren.length,
    },
    descendants,
    totalDescendants,
    truncated,
    truncatedByDepth,
  }
})

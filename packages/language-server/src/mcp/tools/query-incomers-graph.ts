// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import {
  elementSummarySchema,
  type GraphNode,
  type GraphNodeNeighbor,
  projectIdSchema,
  traverseGraph,
} from './_common'

const neighborSchema = z.object({
  elementId: z.string().describe('ID of the incoming element'),
  relationshipLabel: z.string().optional().describe('Label on the relationship'),
  technology: z.string().optional().describe('Technology specified on the relationship'),
})

export const queryIncomersGraph = likec4Tool({
  name: 'query-incomers-graph',
  description: `
Query the complete graph of all elements that provide input to the target element (recursive incomers/producers).

This tool performs a breadth-first traversal to discover all upstream dependencies - elements that directly or
indirectly provide input to the target element. It returns the complete subgraph in a single response,
making it much more efficient than repeated individual queries.

Request:
- elementId: string — target element id (FQN) to start from
- includeIndirect: boolean (optional, default: true) — include relationships through nested elements
- maxDepth: number (optional, default: 10, max: 50) — maximum traversal depth to prevent infinite recursion
- maxNodes: number (optional, default: 200, max: 2000) — maximum number of nodes to return
- project: string (optional) — project id. Defaults to "default" if omitted.

Response Structure:
{
  "target": "element.id",
  "totalNodes": number,
  "maxDepth": number,
  "truncated": boolean,
  "nodes": {
    "element.id": {
      "id": "element.id",
      "name": "name",
      "kind": "kind",
      "title": "title",
      "tags": ["tag1", "tag2"],
      "metadata": {},
      "includedInViews": [...],
      "incomers": [
        {
          "elementId": "id1",
          "relationshipLabel": "uses",
          "technology": "REST"
        }
      ],
      "depth": number
    }
  }
}

Use Cases:
- Find all producers/dependencies for an element
- Trace data lineage upstream
- Identify root causes and dependencies
- Build complete dependency trees
- Answer "what feeds into this?" questions

Notes:
- Read-only, idempotent, no side effects
- Cycle detection prevents infinite loops
- Result size limited to maxNodes to prevent huge responses
- If truncated=true, increase maxNodes or reduce maxDepth to get more specific results

Example:
For a database element, this returns all services, APIs, and components that write to it,
plus all their dependencies, recursively up to maxDepth levels.
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Query complete incomers graph',
  },
  inputSchema: {
    elementId: z.string().describe('Target element id (FQN) to query incomers for'),
    includeIndirect: z.boolean().optional().default(true).describe(
      'Include indirect relationships through nested elements (default: true)',
    ),
    maxDepth: z.number().int().positive().max(50).optional().default(10).describe(
      'Maximum traversal depth (default: 10, max: 50)',
    ),
    maxNodes: z.number().int().positive().max(2000).optional().default(200).describe(
      'Maximum number of nodes to return (default: 200, max: 2000)',
    ),
    project: projectIdSchema,
  },
  outputSchema: {
    target: z.string().describe('Target element id'),
    totalNodes: z.number().describe('Total number of nodes in the graph'),
    maxDepth: z.number().describe('Maximum depth reached'),
    truncated: z.boolean().describe('True if result was truncated due to maxNodes limit'),
    nodes: z.record(elementSummarySchema.extend({
      incomers: z.array(neighborSchema).describe('Incoming relationships with details'),
      depth: z.number().describe('Distance from target element (0 = target)'),
    })),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const targetElement = model.findElement(args.elementId)
  invariant(targetElement, `Element "${args.elementId}" not found in project "${projectId}"`)

  const filter = args.includeIndirect ? 'all' : 'direct'

  const result = traverseGraph(model, args.elementId, 'incoming', filter, args.maxDepth, args.maxNodes)

  const nodes: Record<string, Omit<GraphNode, 'neighbors'> & { incomers: GraphNodeNeighbor[] }> = {}
  for (const [id, node] of Object.entries(result.nodes)) {
    const { neighbors, ...rest } = node
    nodes[id] = { ...rest, incomers: neighbors }
  }

  return {
    target: result.target,
    totalNodes: result.totalNodes,
    maxDepth: result.maxDepth,
    truncated: result.truncated,
    nodes,
  }
})

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import {
  type GraphNode,
  type GraphNodeNeighbor,
  elementSummarySchema,
  projectIdSchema,
  traverseGraph,
} from './_common'

const neighborSchema = z.object({
  elementId: z.string().describe('ID of the outgoing element'),
  relationshipLabel: z.string().optional().describe('Label on the relationship'),
  technology: z.string().optional().describe('Technology specified on the relationship'),
})

export const queryOutgoersGraph = likec4Tool({
  name: 'query-outgoers-graph',
  description: `
Query the complete graph of all elements that receive output from the target element (recursive outgoers/consumers).

This tool performs a breadth-first traversal to discover all downstream dependencies - elements that directly or
indirectly consume output from the target element. It returns the complete subgraph in a single response,
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
      "outgoers": [
        {
          "elementId": "id1",
          "relationshipLabel": "sends data to",
          "technology": "Kafka"
        }
      ],
      "depth": number
    }
  }
}

Use Cases:
- Find all consumers/dependents of an element
- Trace data lineage downstream
- Assess impact of changes (blast radius)
- Build complete consumer trees
- Answer "what depends on this?" questions

Notes:
- Read-only, idempotent, no side effects
- Cycle detection prevents infinite loops
- Result size limited to maxNodes to prevent huge responses
- If truncated=true, increase maxNodes or reduce maxDepth to get more specific results

Example:
For an API service, this returns all clients, services, and systems that consume its output,
plus all their consumers, recursively up to maxDepth levels.
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Query complete outgoers graph',
  },
  inputSchema: {
    elementId: z.string().describe('Target element id (FQN) to query outgoers for'),
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
      outgoers: z.array(neighborSchema).describe('Outgoing relationships with details'),
      depth: z.number().describe('Distance from target element (0 = target)'),
    })),
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const targetElement = model.findElement(args.elementId)
  invariant(targetElement, `Element "${args.elementId}" not found in project "${projectId}"`)

  const filter = args.includeIndirect ? 'all' : 'direct'

  const result = traverseGraph(model, args.elementId, 'outgoing', filter, args.maxDepth, args.maxNodes)

  const nodes: Record<string, Omit<GraphNode, 'neighbors'> & { outgoers: GraphNodeNeighbor[] }> = {}
  for (const [id, node] of Object.entries(result.nodes)) {
    const { neighbors, ...rest } = node
    nodes[id] = { ...rest, outgoers: neighbors }
  }

  return {
    target: result.target,
    totalNodes: result.totalNodes,
    maxDepth: result.maxDepth,
    truncated: result.truncated,
    nodes,
  }
})

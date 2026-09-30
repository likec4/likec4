// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import {
  type GraphNode,
  type GraphNodeNeighbor,
  elementSummarySchema,
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
  description:
    `Recursive upstream traversal: every element that feeds into the target, directly or transitively, returned as one graph with each node's depth and incomers. Answers "what feeds into this?" in one call instead of repeated query-graph calls. Stops at maxDepth or maxNodes; if truncated is true, raise maxNodes or lower maxDepth.`,
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
    nodes: z.record(
      z.string(),
      elementSummarySchema.extend({
        incomers: z.array(neighborSchema).describe('Incoming relationships with details'),
        depth: z.number().describe('Distance from target element (0 = target)'),
      }),
    ),
  },
})(async (languageServices, args) => {
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

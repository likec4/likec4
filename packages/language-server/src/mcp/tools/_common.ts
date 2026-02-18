// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4ProjectConfig } from '@likec4/config'
import type {
  DeploymentElementModel,
  DeploymentNodeModel,
  ElementModel,
  IncomingFilter,
  LikeC4ViewModel,
  OutgoingFilter,
} from '@likec4/core/model'
import type { AnyAux, ProjectId } from '@likec4/core/types'
import { invariant } from '@likec4/core'
import { URI } from 'vscode-uri'
import * as z from 'zod/v3'
import type { LikeC4LanguageServices } from '../../LikeC4LanguageServices'
import type { Locate } from '../../protocol'
import { ProjectsManager } from '../../workspace'
import { logger } from '../utils'

/**
 * Schema for serializable project configuration
 * This is a simplified version that omits non-serializable fields like generators
 */
export const projectConfigSchema = z.object({
  name: z.string().describe('Project identifier'),
  title: z.string().optional().describe('Human-readable project title'),
  contactPerson: z.string().optional().describe('Maintainer contact information'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Custom project metadata as key-value pairs'),
  extends: z.union([z.string(), z.array(z.string())]).optional().describe('Style inheritance paths'),
  exclude: z.array(z.string()).optional().describe('File exclusion patterns'),
  include: z.object({
    paths: z.array(z.string()).describe('Include paths'),
    maxDepth: z.number().describe('Maximum directory depth'),
    fileThreshold: z.number().describe('File threshold'),
  }).optional().describe('Include configuration'),
  manualLayouts: z.object({
    outDir: z.string().describe('Output directory for manual layouts'),
  }).optional().describe('Manual layouts configuration'),
  styles: z.object({
    hasTheme: z.boolean().describe('Whether theme customization is defined'),
    hasDefaults: z.boolean().describe('Whether default style values are defined'),
    hasCustomCss: z.boolean().describe('Whether custom CSS is defined'),
  }).optional().describe('Simplified styles configuration (boolean flags)'),
})

export type SerializableProjectConfig = z.infer<typeof projectConfigSchema>

/**
 * Serializes project configuration for MCP response.
 * Simplifies complex nested structures and omits non-serializable fields (generators).
 */
export function serializeConfig(config: LikeC4ProjectConfig): SerializableProjectConfig {
  const result: SerializableProjectConfig = {
    name: config.name,
  }

  if (config.title != null) {
    result.title = config.title
  }
  if (config.contactPerson != null) {
    result.contactPerson = config.contactPerson
  }
  if (config.metadata) {
    result.metadata = config.metadata
  }
  if (config.extends) {
    result.extends = config.extends
  }
  if (config.exclude) {
    result.exclude = config.exclude
  }
  if (config.include) {
    result.include = {
      paths: config.include.paths || [],
      maxDepth: config.include.maxDepth ?? 3,
      fileThreshold: config.include.fileThreshold ?? 30,
    }
  }
  if (config.manualLayouts) {
    result.manualLayouts = {
      outDir: config.manualLayouts.outDir ?? '.likec4',
    }
  }

  if (config.styles) {
    result.styles = {
      hasTheme: !!config.styles.theme,
      hasDefaults: !!config.styles.defaults,
      hasCustomCss: !!config.styles.customCss,
    }
  }

  return result
}

export const elementSummarySchema = z.object({
  id: z.string().describe('Element id (FQN)'),
  name: z.string().describe('Element name'),
  kind: z.string().describe('Element kind'),
  title: z.string(),
  tags: z.array(z.string()),
  metadata: z.record(z.union([z.string(), z.array(z.string())])),
  includedInViews: z.array(z.object({
    id: z.string().describe('View id'),
    title: z.string().describe('View title'),
    type: z.enum(['element', 'deployment', 'dynamic']).describe('View type'),
  })).describe('Views that include this element'),
})

export type ElementSummary = z.infer<typeof elementSummarySchema>

/**
 * Serializes an element model into a summary object for MCP responses.
 */
export function serializeElement(element: ElementModel<AnyAux> | DeploymentElementModel<AnyAux>): ElementSummary {
  return {
    id: element.id,
    name: element.name,
    kind: element.kind,
    title: element.title,
    tags: [...element.tags],
    metadata: element.getMetadata(),
    includedInViews: includedInViews(element.views()),
  }
}

export type GraphDirection = 'incoming' | 'outgoing'

export interface GraphTraversalArgs {
  elementId: string
  includeIndirect: boolean
  maxDepth: number
  maxNodes: number
  project: string
}

export interface GraphNodeNeighbor {
  elementId: string
  relationshipLabel?: string
  technology?: string
}

export interface GraphNode extends ElementSummary {
  neighbors: GraphNodeNeighbor[]
  depth: number
}

export interface GraphTraversalResult {
  target: string
  totalNodes: number
  maxDepth: number
  truncated: boolean
  nodes: Record<string, GraphNode>
}

/**
 * Generic BFS graph traversal used by both query-incomers-graph and query-outgoers-graph.
 */
export function traverseGraph(
  model: { findElement: (id: string) => ElementModel<AnyAux> | null | undefined },
  startElementId: string,
  direction: GraphDirection,
  filter: IncomingFilter | OutgoingFilter,
  maxDepth: number,
  maxNodes: number,
): GraphTraversalResult {
  const startElement = model.findElement(startElementId)
  invariant(startElement, `Element "${startElementId}" not found`)

  const visited = new Set<string>()
  const nodes: Record<string, GraphNode> = {}
  let actualMaxDepth = 0
  let truncated = false

  const queue: Array<{ elementId: string; depth: number }> = [{ elementId: startElementId, depth: 0 }]

  while (queue.length > 0) {
    const { elementId, depth } = queue.shift()!

    if (depth > maxDepth) continue
    if (visited.has(elementId)) continue
    if (visited.size >= maxNodes) {
      truncated = true
      break
    }

    const element = model.findElement(elementId)
    if (!element) continue

    visited.add(elementId)
    actualMaxDepth = Math.max(actualMaxDepth, depth)

    const relations = direction === 'incoming'
      ? [...element.incoming(filter as IncomingFilter)]
      : [...element.outgoing(filter as OutgoingFilter)]

    const neighbors: GraphNodeNeighbor[] = relations.map(rel => {
      const neighborId = direction === 'incoming' ? rel.source.id : rel.target.id
      const data: GraphNodeNeighbor = { elementId: neighborId }
      if (rel.title) data.relationshipLabel = rel.title
      if (rel.technology) data.technology = rel.technology
      return data
    })

    nodes[elementId] = {
      ...serializeElement(element),
      neighbors,
      depth,
    }

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.elementId)) {
        queue.push({ elementId: neighbor.elementId, depth: depth + 1 })
      }
    }
  }

  // Filter out dangling neighbor references (occurs both when maxNodes is
  // hit and when maxDepth limits how deep we expand)
  for (const node of Object.values(nodes)) {
    node.neighbors = node.neighbors.filter(n => n.elementId in nodes)
  }

  return {
    target: startElementId,
    totalNodes: visited.size,
    maxDepth: actualMaxDepth,
    truncated,
    nodes,
  }
}

export const locationSchema = z.object({
  path: z.string().describe('Path to the file'),
  range: z.object({
    start: z.object({
      line: z.number(),
      character: z.number(),
    }),
    end: z.object({
      line: z.number(),
      character: z.number(),
    }),
  }).describe('Range in the file'),
}).nullable()

export const projectIdSchema = z.string()
  .refine((_v): _v is ProjectId => true)
  .optional()
  .default(ProjectsManager.DefaultProjectId)
  .describe('Project id (optional, will use "default" if not specified)')

export const includedInViewsSchema = z.array(z.object({
  id: z.string().describe('View id'),
  title: z.string().describe('View title'),
  type: z.enum(['element', 'deployment', 'dynamic']).describe('View type'),
}))

export const includedInViews = (views: Iterable<LikeC4ViewModel>): z.infer<typeof includedInViewsSchema> => {
  return [...views].map(v => ({
    id: v.id,
    title: v.titleOrId,
    type: v.$view._type,
  }))
}

export const mkLocate = (
  languageServices: LikeC4LanguageServices,
  projectId: string,
) =>
(params: Locate.Params): z.infer<typeof locationSchema> => {
  try {
    const loc = languageServices.locate({ projectId, ...params })
    return loc
      ? {
        path: URI.parse(loc.uri).fsPath,
        range: loc.range,
      }
      : null
  } catch (e) {
    logger.debug(`Failed to locate {params}`, { error: e, params })
    return null
  }
}

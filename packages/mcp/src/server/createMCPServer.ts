// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { loggable, logger } from '@likec4/log'
import { completable } from '@modelcontextprotocol/sdk/server/completable.js'
import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { prop } from 'remeda'
import z from 'zod/v3'
import packageJson from '../../package.json' with { type: 'json' }
import { projectIdSchema } from '../tools/_common'
import { registerApplySemanticLayoutTool } from '../tools/apply-semantic-layout'
import { batchReadElements } from '../tools/batch-read-elements'
import { elementDiff } from '../tools/element-diff'
import { findRelationshipPaths } from '../tools/find-relationship-paths'
import { findRelationships } from '../tools/find-relationships'
import { listProjects } from '../tools/list-projects'
import { queryByMetadata } from '../tools/query-by-metadata'
import { queryByTagPattern } from '../tools/query-by-tag-pattern'
import { queryByTags } from '../tools/query-by-tags'
import { queryGraph } from '../tools/query-graph'
import { queryIncomersGraph } from '../tools/query-incomers-graph'
import { queryOutgoersGraph } from '../tools/query-outgoers-graph'
import { readDeployment } from '../tools/read-deployment'
import { readElement } from '../tools/read-element'
import { readProjectSummary } from '../tools/read-project-summary'
import { readView } from '../tools/read-view'
import { searchElement } from '../tools/search-element'
import { subgraphSummary } from '../tools/subgraph-summary'

export function createMCPServer(services: LikeC4LanguageServices, options?: ServerOptions): McpServer {
  const mcp = new McpServer({
    name: 'LikeC4',
    version: packageJson.version,
  }, {
    instructions: `LikeC4 MCP – query and navigate LikeC4 models.

Conventions:
- All tools are read-only and idempotent.
- "project" is optional and defaults to "default".

Available tools:
- list-projects — List all LikeC4 projects in the workspace.
- read-project-summary — Project specification, configuration, all elements, deployment nodes and views. Input: { project? }.
- search-element — Search elements and deployment nodes across all projects by id/title/kind/shape/tags/metadata. Input: { search }.
- read-element — Full element details including relationships, includedInViews, deployedInstances, metadata and sourceLocation. Input: { id, project? }.
- read-deployment — Details of a deployment node or deployed instance. Input: { id, project? }.
- read-view — Full view details (nodes/edges) and sourceLocation. Input: { viewId, project? }.
- find-relationships — Direct and indirect relationships between two elements in a project. Input: { element1, element2, project? }.
- query-graph — Query element hierarchy (ancestors, descendants, siblings, children, parent) and relationships (incomers, outgoers). Input: { elementId, queryType, includeIndirect?, project? }.
- query-incomers-graph — Get complete graph of all upstream dependencies/producers (recursive incomers). Much more efficient than repeated query-graph calls. Input: { elementId, includeIndirect?, maxDepth?, maxNodes?, project? }.
- query-outgoers-graph — Get complete graph of all downstream consumers/dependents (recursive outgoers). Much more efficient than repeated query-graph calls. Input: { elementId, includeIndirect?, maxDepth?, maxNodes?, project? }.
- query-by-metadata — Search elements by metadata key-value pairs with exact/contains/exists matching. Input: { key, value?, matchMode?, project? }.
- query-by-tags — Advanced tag filtering with boolean logic (allOf, anyOf, noneOf). Input: { allOf?, anyOf?, noneOf?, project? }.
- find-relationship-paths — Discover all paths (chains of relationships) between two elements with BFS traversal. Input: { sourceId, targetId, maxDepth?, includeIndirect?, project? }.
- batch-read-elements — Read details of multiple elements in a single call, reducing round-trips. Input: { ids, project? }.
- query-by-tag-pattern — Search elements by tag prefix/contains/suffix patterns. Input: { pattern, matchMode?, project? }.
- element-diff — Compare two elements side-by-side showing differences in properties, tags, metadata, and relationships. Input: { element1Id, element2Id, project? }.
- subgraph-summary — Compact summary of all descendants of a parent element with metadata, tags, and relationship counts. Input: { elementId, maxDepth?, metadataKeys?, project? }.

Instructions:
- Identify the project first  
  - Use "search-element" to find elements by id/title/kind/shape/tags/metadata and select the project
  - Use "read-project-summary" to find all elements and deployment nodes inside the project, what kinds, tags, metadata keys are available
  - Use "list-projects" to list all available projects
- If response returns "sourceLocation", provide link to this location in the editor

Full documentation: https://likec4.dev/llms-full.txt
`,
    enforceStrictCapabilities: true,
    ...options,
    capabilities: {
      tools: {},
      logging: {},
      prompts: {},
      resources: {},
      ...options?.capabilities,
    },
  })
  mcp.registerTool(...listProjects(services))
  mcp.registerTool(...readProjectSummary(services))
  mcp.registerTool(...readElement(services))
  mcp.registerTool(...readDeployment(services))
  mcp.registerTool(...readView(services))
  mcp.registerTool(...searchElement(services))
  mcp.registerTool(...findRelationships(services))
  mcp.registerTool(...queryGraph(services))
  mcp.registerTool(...queryIncomersGraph(services))
  mcp.registerTool(...queryOutgoersGraph(services))
  mcp.registerTool(...queryByMetadata(services))
  mcp.registerTool(...queryByTags(services))
  mcp.registerTool(...findRelationshipPaths(services))
  mcp.registerTool(...batchReadElements(services))
  mcp.registerTool(...queryByTagPattern(services))
  mcp.registerTool(...elementDiff(services))
  mcp.registerTool(...subgraphSummary(services))

  mcp.registerPrompt(
    'apply_semantic_layout',
    {
      title: 'Apply semantic layout to a view',
      argsSchema: {
        projectId: completable(projectIdSchema, (_value) => {
          const value = _value ?? ''
          return services.projects().filter(project => project.id.startsWith(value)).map(prop('id'))
        }),
        viewId: completable(
          z.string().describe('View ID to apply semantic layout to'),
          async (_value, ctx) => {
            const projectId = ctx?.arguments?.['projectId']
            if (!projectId) {
              return []
            }
            const model = await services.builder.parseModel(projectId as ProjectId)
            if (!model) {
              return []
            }
            const value = _value ?? ''
            return Array.from(model.views()).filter((view) => view.id.startsWith(value)).map(prop('id'))
          },
        ),
      },
    },
    async ({ viewId, projectId }, _ctx) => {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Call \`apply-semantic-layout\` tool of likec4 mcp with these arguments:\n${
              JSON.stringify({ viewId, projectId })
            }`,
          },
        }],
      }
    },
  )
  registerApplySemanticLayoutTool(mcp, services)

  const resource = mcp.registerResource(
    'likec4-project',
    new ResourceTemplate('likec4://project/{projectId}', {
      list: async () => {
        const projects = services.projects()
        return ({
          resources: projects.map(p => ({
            uri: `likec4://project/${encodeURIComponent(p.id)}`,
            name: p.title,
          })),
        })
      },
      complete: {
        projectId: (value) => {
          if (!value) {
            return services.projects().map(p => p.id)
          }
          const lowerValue = value.toLowerCase()
          return services.projects().filter(p => p.id.includes(lowerValue)).map(p => p.id)
        },
      },
    }),
    {
      description: 'LikeC4 project resource',
      mimeType: 'application/json',
    },
    async (uri: URL, { projectId }) => {
      const ids = Array.isArray(projectId) ? projectId : [projectId]
      const projects = services.projects().filter(p => ids.includes(p.id))

      return ({
        contents: projects.map(p => ({
          uri: `likec4://project/${encodeURIComponent(p.id)}`,
          text: JSON.stringify({
            id: p.id,
            title: p.title,
            folder: p.folder.fsPath,
          }),
        })),
      })
    },
  )

  mcp.server.onerror = (err) => {
    logger.error(loggable(err))
  }

  return mcp
}

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { loggable } from '@likec4/log'
import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import packageJson from '../../../package.json' with { type: 'json' }
import { logger } from '../../logger'
import type { LikeC4Services } from '../../module'
import { batchReadElements } from '../tools/batch-read-elements'
import { elementDiff } from '../tools/element-diff'
import { findRelationshipPaths } from '../tools/find-relationship-paths'
import { findRelationships } from '../tools/find-relationships'
import { listProjects } from '../tools/list-projects'
import { openView } from '../tools/open-view'
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
import type { LikeC4MCPServerFactory } from '../types'

export class MCPServerFactory implements LikeC4MCPServerFactory {
  constructor(private services: LikeC4Services) {
  }

  create(options?: ServerOptions): McpServer {
    const isInEditor = this.services.shared.lsp.Connection !== undefined

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
${
        isInEditor
          ? '- open-view — Opens the LikeC4 view panel in the editor. Triggers UI; at most one preview panel at a time. Input: { viewId, project? }.'
          : ''
      }

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
        ...options?.capabilities,
      },
    })
    mcp.registerTool(...listProjects(this.services.likec4.LanguageServices))
    mcp.registerTool(...readProjectSummary(this.services.likec4.LanguageServices))
    mcp.registerTool(...readElement(this.services.likec4.LanguageServices))
    mcp.registerTool(...readDeployment(this.services.likec4.LanguageServices))
    mcp.registerTool(...readView(this.services.likec4.LanguageServices))
    mcp.registerTool(...searchElement(this.services.likec4.LanguageServices))
    mcp.registerTool(...findRelationships(this.services.likec4.LanguageServices))
    mcp.registerTool(...queryGraph(this.services.likec4.LanguageServices))
    mcp.registerTool(...queryIncomersGraph(this.services.likec4.LanguageServices))
    mcp.registerTool(...queryOutgoersGraph(this.services.likec4.LanguageServices))
    mcp.registerTool(...queryByMetadata(this.services.likec4.LanguageServices))
    mcp.registerTool(...queryByTags(this.services.likec4.LanguageServices))
    mcp.registerTool(...findRelationshipPaths(this.services.likec4.LanguageServices))
    mcp.registerTool(...batchReadElements(this.services.likec4.LanguageServices))
    mcp.registerTool(...queryByTagPattern(this.services.likec4.LanguageServices))
    mcp.registerTool(...elementDiff(this.services.likec4.LanguageServices))
    mcp.registerTool(...subgraphSummary(this.services.likec4.LanguageServices))
    if (isInEditor) {
      mcp.registerTool(...openView(this.services.likec4.LanguageServices))
    }

    mcp.server.onerror = (err) => {
      logger.error(loggable(err))
    }

    return mcp
  }
}

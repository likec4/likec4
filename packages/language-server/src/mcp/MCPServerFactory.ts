import { loggable } from '@likec4/log'
import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import packageJson from '../../package.json' with { type: 'json' }
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { findRelationships } from './tools/find-relationships'
import { listProjects } from './tools/list-projects'
import { openView } from './tools/open-view'
import { readDeployment } from './tools/read-deployment'
import { readElement } from './tools/read-element'
import { readProjectSummary } from './tools/read-project-summary'
import { readView } from './tools/read-view'
import { searchElement } from './tools/search-element'

export class LikeC4MCPServerFactory {
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
- read-project-summary — Project specification (element kinds, deployment node kinds, tags, metadata keys), all elements, deployment nodes and views. Input: { project? }.
- search-element — Search elements and deployment nodes across all projects by id/title/kind/shape/tags. Input: { search }.
- read-element — Full element details including relationships, includedInViews, deployedInstances, and sourceLocation. Input: { id, project? }.
- read-deployment — Details of a deployment node or deployed instance. Input: { id, project? }.
- read-view — Full view details (nodes/edges) and sourceLocation. Input: { viewId, project? }.
- find-relationships — Direct and indirect relationships between two elements in a project. Input: { element1, element2, project? }.
${
        isInEditor
          ? '- open-view — Opens the LikeC4 view panel in the editor. Triggers UI; at most one preview panel at a time. Input: { viewId, project? }.'
          : ''
      }

Instructions:
- Identify the project first  
  - Use "search-element" to find elements by id/title/kind/shape/tags and select the project
  - Use "read-project-summary" to find all elements and deployment nodes inside the project, what kinds, tags, metadata keys are available
  - Use "list-projects" to list all available projects
- If resource returns "sourceLocation", provide link to this location in the editor

Docs: https://likec4.dev/llms-full.txt
`,
      ...options,
      capabilities: {
        tools: {},
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
    if (isInEditor) {
      mcp.registerTool(...openView(this.services.likec4.LanguageServices))
    }

    mcp.server.onerror = (err) => {
      logger.error(loggable(err))
    }

    return mcp
  }
}

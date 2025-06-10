import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import packageJson from '../../../package.json' with { type: 'json' }
import type { LikeC4Services } from '../../module'
import { LikeC4MCPTools } from '../LikeC4MCPTools'

function toolResponse(text: string): CallToolResult {
  return {
    content: [{
      type: 'text',
      text,
    }],
  }
}

export class LikeC4MCPServerFactory {
  constructor(private services: LikeC4Services) {
  }

  create(options?: ServerOptions): McpServer {
    const {
      instructions,
      listProjects,
      readProjectSummary,
      searchElement,
      readElement,
      readView,
    } = LikeC4MCPTools

    const mcp = new McpServer({
      name: 'LikeC4',
      version: packageJson.version,
    }, {
      instructions,
      ...options,
      capabilities: {
        tools: {},
        ...options?.capabilities,
      },
    })

    const tools = this.services.mcp.Tools

    mcp.tool(
      listProjects.name,
      listProjects.description,
      async () => {
        return toolResponse(await tools.listProjects())
      },
    )

    mcp.tool(
      readProjectSummary.name,
      readProjectSummary.description,
      readProjectSummary.paramsSchema,
      async (params) => {
        return toolResponse(await tools.readProjectSummary(params.project))
      },
    )

    mcp.tool(
      searchElement.name,
      searchElement.description,
      searchElement.paramsSchema,
      async (params) => {
        return toolResponse(await tools.searchElement(params))
      },
    )

    mcp.tool(
      readElement.name,
      readElement.description,
      readElement.paramsSchema,
      async (params) => {
        return toolResponse(await tools.readElement(params))
      },
    )

    mcp.tool(
      readView.name,
      readView.description,
      readView.paramsSchema,
      async (params) => {
        return toolResponse(await tools.readView(params))
      },
    )

    return mcp
  }
}

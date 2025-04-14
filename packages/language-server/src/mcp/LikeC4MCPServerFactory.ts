import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import packageJson from '../../package.json' assert { type: 'json' }
import type { LikeC4Services } from '../module'
import { LikeC4MCPTools } from './LikeC4MCPTools'

export interface LikeC4MCPServer {
  start(port: number): Promise<void>
  stop(): Promise<void>
}

export class NoopLikeC4MCPServer implements LikeC4MCPServer {
  start(port: number) {
    return Promise.reject(new Error('Not implemented'))
  }
  stop() {
    return Promise.reject(new Error('Not implemented'))
  }
}

export class LikeC4MCPServerFactory {
  constructor(private services: LikeC4Services) {
  }

  create(): McpServer {
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
      capabilities: {
        // completions: {},
        tools: {},
        // resources: {},
      },
      instructions,
    })

    const tools = this.services.mcp.Tools

    mcp.tool(
      listProjects.name,
      listProjects.description,
      async () => {
        const text = await tools.listProjects()
        return {
          content: [{
            type: 'text',
            text,
          }],
        }
      },
    )

    mcp.tool(
      readProjectSummary.name,
      readProjectSummary.description,
      readProjectSummary.paramsSchema,
      async (params) => {
        const text = await tools.readProjectSummary(params.project)
        return {
          content: [{
            type: 'text',
            text,
          }],
        }
      },
    )

    mcp.tool(
      searchElement.name,
      searchElement.description,
      searchElement.paramsSchema,
      async (params) => {
        const text = await tools.searchElement(params)
        return {
          content: [{
            type: 'text',
            text,
          }],
        }
      },
    )

    mcp.tool(
      readElement.name,
      readElement.description,
      readElement.paramsSchema,
      async (params) => {
        const text = await tools.readElement(params)
        return {
          content: [{
            type: 'text',
            text,
          }],
        }
      },
    )

    mcp.tool(
      readView.name,
      readView.description,
      readView.paramsSchema,
      async (params) => {
        const text = await tools.readView(params)
        return {
          content: [{
            type: 'text',
            text,
          }],
        }
      },
    )

    return mcp
  }
}

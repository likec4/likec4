import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export interface LikeC4MCPServer {
  readonly isStarted: boolean
  readonly port: number
  start(port: number): Promise<void>
  stop(): Promise<void>
}

export interface LikeC4MCPServerFactory {
  create(options?: ServerOptions): McpServer
}

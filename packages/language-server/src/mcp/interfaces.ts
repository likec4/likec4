import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { LikeC4Services } from '../module'
import { NoopLikeC4MCPServer, NoopLikeC4MCPServerFactory } from './NoopLikeC4MCPServer'

export interface LikeC4MCPServer {
  readonly mcp: McpServer
  readonly isStarted: boolean
  readonly port: number
  start(port?: number): Promise<void>
  stop(): Promise<void>
}

export interface LikeC4MCPServerFactory {
  create(options?: ServerOptions): McpServer
}

export interface LikeC4MCPServerModuleContext {
  mcpServer: (services: LikeC4Services) => LikeC4MCPServer
  mcpServerFactory: (services: LikeC4Services) => LikeC4MCPServerFactory
}

export const NoMCPServer: LikeC4MCPServerModuleContext = {
  mcpServer: () => new NoopLikeC4MCPServer(),
  mcpServerFactory: () => new NoopLikeC4MCPServerFactory(),
}

import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { LikeC4Services } from '../module'

export interface LikeC4MCPServer {
  start(port: number): Promise<void>
  stop(): Promise<void>
}

export interface LikeC4MCPServerFactory {
  create(options?: ServerOptions): McpServer
}

export class NoopLikeC4MCPServer implements LikeC4MCPServer {
  start(port: number) {
    return Promise.reject(new Error('Not implemented'))
  }
  stop() {
    return Promise.reject(new Error('Not implemented'))
  }
}

export class NoopLikeC4MCPServerFactory implements LikeC4MCPServerFactory {
  constructor(private services: LikeC4Services) {
  }

  create(options?: ServerOptions): McpServer {
    throw new Error('NoopLikeC4MCPServerFactory - switch to implementation')
  }
}

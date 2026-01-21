import type { ServerOptions } from '@modelcontextprotocol/sdk/server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { LikeC4MCPServer, LikeC4MCPServerFactory } from './interfaces'

export class NoopLikeC4MCPServer implements LikeC4MCPServer {
  get mcp(): McpServer {
    throw new Error('NoopLikeC4MCPServer does not have a McpServer')
  }
  get isStarted(): boolean {
    return false
  }
  get port(): number {
    return NaN
  }
  start() {
    return Promise.resolve()
  }
  stop() {
    return Promise.resolve()
  }
}

export class NoopLikeC4MCPServerFactory implements LikeC4MCPServerFactory {
  create(_options?: ServerOptions): McpServer {
    throw new Error('NoopLikeC4MCPServerFactory')
  }
}

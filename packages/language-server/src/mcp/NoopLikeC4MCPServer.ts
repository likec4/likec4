import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { LikeC4Services } from '../module'
import type { LikeC4MCPServer, LikeC4MCPServerFactory } from './interfaces'

export class NoopLikeC4MCPServer implements LikeC4MCPServer {
  get isStarted(): boolean {
    return false
  }
  get port(): number {
    return NaN
  }
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

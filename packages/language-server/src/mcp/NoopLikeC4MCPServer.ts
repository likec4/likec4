import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { LikeC4MCPServer } from './interfaces'

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
  start(port: number) {
    return Promise.resolve()
  }
  stop() {
    return Promise.resolve()
  }
}

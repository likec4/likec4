import type { LikeC4MCPServer, LikeC4MCPServerFactory, LikeC4MCPServerModuleContext } from './types'

export const NoMCPServer: LikeC4MCPServerModuleContext = {
  mcpServer: () => new NoopLikeC4MCPServer(),
  mcpServerFactory: () => new NoopLikeC4MCPServerFactory(),
}

export class NoopLikeC4MCPServer implements LikeC4MCPServer {
  get mcp(): any {
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
  create(_options?: any): any {
    throw new Error('NoopLikeC4MCPServerFactory')
  }
}

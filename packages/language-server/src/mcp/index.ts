import { NoopLikeC4MCPServer, NoopLikeC4MCPServerFactory } from './noop'
import type { LikeC4MCPServerModuleContext } from './types'

export type {
  LikeC4MCPServer,
  LikeC4MCPServerFactory,
  LikeC4MCPServerModuleContext,
} from './types'

export const NoMCPServer: LikeC4MCPServerModuleContext = {
  mcpServer: () => new NoopLikeC4MCPServer(),
  mcpServerFactory: () => new NoopLikeC4MCPServerFactory(),
}

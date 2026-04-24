import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createContext } from 'unctx'

const mcpServerCtx = createContext<McpServer>()

export function useMcpServer() {
  return mcpServerCtx.use()
}

export function setMcpServerCtx(server: McpServer | undefined) {
  if (server) {
    mcpServerCtx.set(server)
  } else {
    mcpServerCtx.unset()
  }
}

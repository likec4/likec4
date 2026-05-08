import type { LikeC4LanguageServices } from '@likec4/language-server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createContext } from 'unctx'

const mcpServerCtx = createContext<McpServer>()

const languageServicesCtx = createContext<LikeC4LanguageServices>()

/**
 * Returns the currently active {@link McpServer}.
 * @throws If called outside of an MCP server lifecycle (no server has been set via `setMcpServerCtx`).
 */
export function useMcpServer() {
  return mcpServerCtx.use()
}

/**
 * Returns the currently active {@link LikeC4LanguageServices}.
 * @throws If called outside of an MCP server lifecycle (no services have been set via `setLanguageServicesCtx`).
 */
export function useLanguageServices() {
  return languageServicesCtx.use()
}

export function setMcpServerCtx<T extends McpServer | undefined>(server: T): T {
  if (server) {
    mcpServerCtx.set(server, true)
  } else {
    mcpServerCtx.unset()
  }
  return server
}

export function setLanguageServicesCtx<T extends LikeC4LanguageServices | undefined>(services: T): T {
  if (services) {
    languageServicesCtx.set(services, true)
  } else {
    languageServicesCtx.unset()
  }
  return services
}

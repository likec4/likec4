import type { LikeC4LanguageServices } from '@likec4/language-server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createContext } from 'unctx'

export const ctx = {
  mcpServer: createContext<McpServer>(),
  languageServices: createContext<LikeC4LanguageServices>(),
} as const

/**
 * Returns the currently active {@link McpServer}.
 * @throws If called outside of an MCP server lifecycle (no server has been set via `setMcpServerCtx`).
 */
export function useMcpServer() {
  return ctx.mcpServer.use()
}

/**
 * Returns the currently active {@link LikeC4LanguageServices}.
 * @throws If called outside of an MCP server lifecycle (no services have been set via `setLanguageServicesCtx`).
 */
export function useLanguageServices() {
  return ctx.languageServices.use()
}

export function setMcpServerCtx<T extends McpServer | undefined>(server: T): T {
  if (server) {
    ctx.mcpServer.set(server, true)
  } else {
    ctx.mcpServer.unset()
  }
  return server
}

export function setLanguageServicesCtx<T extends LikeC4LanguageServices | undefined>(services: T): T {
  if (services) {
    ctx.languageServices.set(services, true)
  } else {
    ctx.languageServices.unset()
  }
  return services
}

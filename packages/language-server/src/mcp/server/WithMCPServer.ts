import { loggable } from '@likec4/log'
import { isError } from 'remeda'
import { logger } from '../../logger'
import type { LikeC4Services } from '../../module'
import type { LikeC4MCPServer, LikeC4MCPServerModuleContext } from '../interfaces'
import { StdioLikeC4MCPServer } from './StdioLikeC4MCPServer'
import { StreamableLikeC4MCPServer } from './StreamableLikeC4MCPServer'

const streamableLikeC4MCPServer = (services: LikeC4Services): LikeC4MCPServer => {
  logger.debug('Creating StreamableLikeC4MCPServer')
  const server = new StreamableLikeC4MCPServer(services)
  const langId = services.LanguageMetaData.languageId

  const connection = services.shared.lsp.Connection

  services.shared.workspace.ConfigurationProvider.onConfigurationSectionUpdate((update) => {
    if (update.section !== langId) {
      logger.warn('Unexpected configuration update: {update}', { update })
      return
    }
    logger.debug('Configuration update: {update}', { update })

    const {
      enabled = false,
      port = 33335,
    } = update.configuration.mcp as { enabled?: boolean; port?: number }

    if (!enabled) {
      server.stop()
      return
    }
    Promise.resolve()
      .then(() => server.start(port))
      .then(() => {
        connection?.telemetry?.logEvent({
          eventName: 'mcp-server-started',
          mcpPort: port,
        })
      })
      .catch(err => {
        const message = isError<Error>(err) ? err.message : undefined
        connection?.telemetry?.logEvent({
          eventName: 'mcp-server-start-failed',
          mcpPort: port,
          ...message && { message },
        })
        logger.error('Failed to start LikeC4 MCP Server', { err })
        if (connection) {
          connection.window.showErrorMessage(`LikeC4: Failed to start MCP Server\n\n${loggable(err)}`)
        }
      })
  })

  return server
}

const stdioLikeC4MCPServer = (services: LikeC4Services): LikeC4MCPServer => {
  return new StdioLikeC4MCPServer(services)
}

export const WithMCPServer = (type: 'stdio' | 'sse' = 'sse'): LikeC4MCPServerModuleContext => ({
  mcpServer: (services: LikeC4Services): LikeC4MCPServer => {
    if (type === 'stdio') {
      return stdioLikeC4MCPServer(services)
    }
    return streamableLikeC4MCPServer(services)
  },
})

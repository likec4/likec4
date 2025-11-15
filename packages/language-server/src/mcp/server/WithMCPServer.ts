import { loggable } from '@likec4/log'
import { error } from 'console'
import { isError } from 'remeda'
import type { LikeC4Services } from '../../module'
import type { LikeC4MCPServer, LikeC4MCPServerModuleContext } from '../interfaces'
import { logger } from '../utils'
import { StdioLikeC4MCPServer } from './StdioLikeC4MCPServer'
import { StreamableLikeC4MCPServer } from './StreamableLikeC4MCPServer'

const streamableLikeC4MCPServer = (services: LikeC4Services, defaultPort = 33335): LikeC4MCPServer => {
  logger.debug('Creating StreamableLikeC4MCPServer')
  const server = new StreamableLikeC4MCPServer(services, defaultPort)
  const langId = services.LanguageMetaData.languageId

  const connection = services.shared.lsp.Connection

  services.shared.workspace.ConfigurationProvider.onConfigurationSectionUpdate((update) => {
    if (update.section !== langId) {
      logger.warn('Unexpected configuration update: {update}', { update })
      return
    }

    const {
      enabled = false,
      port = defaultPort,
    } = update.configuration.mcp as { enabled?: boolean; port?: number }

    if (!enabled) {
      void server.stop()
      return
    }
    void Promise.resolve()
      .then(() => server.start(port))
      .then(() => {
        connection?.telemetry?.logEvent({
          eventName: 'mcp-server-started',
          mcpPort: port,
        })
      })
      .catch(err => {
        const message = loggable(err)
        connection?.telemetry?.logEvent({
          eventName: 'mcp-server-start-failed',
          mcpPort: port,
          message,
        })
        logger.warn(`Failed to start LikeC4 MCP Server: \n${message}`)
        if (connection) {
          connection.window.showErrorMessage(`LikeC4: Failed to start MCP Server\n\n${message}`)
        }
      })
  })

  return server
}

const stdioLikeC4MCPServer = (services: LikeC4Services): LikeC4MCPServer => {
  return new StdioLikeC4MCPServer(services)
}

export const WithMCPServer = (type: 'stdio' | 'sse' | { port: number } = 'sse'): LikeC4MCPServerModuleContext => ({
  mcpServer: (services: LikeC4Services): LikeC4MCPServer => {
    if (type === 'stdio') {
      return stdioLikeC4MCPServer(services)
    }
    const port = typeof type === 'object' ? type.port : 33335
    return streamableLikeC4MCPServer(services, port)
  },
})

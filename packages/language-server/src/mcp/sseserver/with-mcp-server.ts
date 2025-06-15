import { loggable } from '@likec4/log'
import { logger } from '../../logger'
import type { LikeC4Services } from '../../module'
import type { LikeC4MCPServer } from '../LikeC4MCPServerFactory'
import { SSELikeC4MCPServer } from './MCPServer'
import { LikeC4MCPServerFactory } from './MCPServerFactory'

export const WithMCPServer = {
  mcp: {
    Server(services: LikeC4Services): LikeC4MCPServer {
      logger.debug('Creating SSELikeC4MCPServer')
      const server = new SSELikeC4MCPServer(services)
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
            })
          })
          .catch(err => {
            logger.error('Failed to start LikeC4 MCP Server', { err })
            if (connection) {
              connection.window.showErrorMessage(`LikeC4: Failed to start MCP Server\n\n${loggable(err)}`)
            }
          })
      })

      return server
    },
    ServerFactory(services: LikeC4Services): LikeC4MCPServerFactory {
      return new LikeC4MCPServerFactory(services)
    },
  },
}

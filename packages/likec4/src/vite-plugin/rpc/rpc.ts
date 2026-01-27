import type { LikeC4LanguageServices } from '@likec4/language-server'
import { createBirpc } from 'birpc'
import type { MinimalPluginContextWithoutEnvironment, ViteDevServer } from 'vite'
import type { ViteLogger } from '../../logger'
import { calcAdhocView } from './calcAdhocView'
import type { LikeC4VitePluginRpc } from './protocol'
import { sendError } from './sendError'
import { updateView } from './updateView'

export type PluginRPCParams = {
  logger: ViteLogger
  likec4: LikeC4LanguageServices
  server: ViteDevServer
}
export function enablePluginRPC(
  this: MinimalPluginContextWithoutEnvironment,
  params: PluginRPCParams,
) {
  let lastError: string | null = null
  const server = params.server
  createBirpc<{}, Omit<LikeC4VitePluginRpc, 'isAvailable'>>({
    updateView: (data) => updateView(params, data),
    calcAdhocView: (data) => calcAdhocView(params, data),
  }, {
    on: fn => server.hot.on('likec4:rpc', fn),
    post: data => server.hot.send('likec4:rpc', data),
    onFunctionError: (error, functionName) => {
      params.logger.error(`RPC error in ${functionName}`, { error })
      const errorString = error.stack ?? error.message
      try {
        if (lastError !== errorString) {
          lastError = errorString
          sendError(server, { name: error.name, error: errorString })
        }
      } catch (e) {
        params.logger.error(`Failed to send error to client`, { error: e as Error })
      }
    },
  })
}

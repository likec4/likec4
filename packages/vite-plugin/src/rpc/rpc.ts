import { createBirpc } from 'birpc'
import type { MinimalPluginContextWithoutEnvironment, ViteDevServer } from 'vite'
import type { AIOptions } from '../plugin'
import type { SharedVirtualModuleOptions } from '../virtuals/_shared'
import { applySemanticLayout } from './functions/applySemanticLayout'
import { calcAdhocView } from './functions/calcAdhocView'
import { updateView } from './functions/updateView'
import type { LikeC4VitePluginRpc } from './protocol'
import { sendError } from './sendError'

export type PluginRPCParams = SharedVirtualModuleOptions & {
  ai?: AIOptions | undefined
  server: ViteDevServer
}
export function enablePluginRPC(
  this: MinimalPluginContextWithoutEnvironment,
  params: PluginRPCParams,
) {
  let lastError: string | null = null
  const server = params.server

  const functions: LikeC4VitePluginRpc = {
    updateView: (data) => updateView(params, data),
    calcAdhocView: (data) => calcAdhocView(params, data),
    applySemanticLayout: (data) => applySemanticLayout(params, data),
  }

  createBirpc(functions, {
    on: fn => server.hot.on('likec4:rpc', fn),
    post: data => server.hot.send('likec4:rpc', data),
    onTimeoutError(functionName) {
      return functionName === 'applySemanticLayout'
    },
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

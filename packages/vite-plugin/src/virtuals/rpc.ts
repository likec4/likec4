import { logGenerating } from '../logger'
import type { SharedVirtualModuleOptions, VirtualModule } from './_shared'

const rpcCode = ({ isAIAvailable, ai, rpcEnabled }: SharedVirtualModuleOptions) =>
  ` 
import { createRpc } from 'likec4/vite-plugin/internal'

export const isRpcAvailable = !!import.meta.hot && ${rpcEnabled}
export const isAIAvailable = isRpcAvailable && ${isAIAvailable}
export const AIAdapter = ${JSON.stringify(ai?.adapter.name)}

export let likec4rpc = {
  applySemanticLayout: () => {
    throw new Error('likec4rpc.applySemanticLayout is not available in production')
  },
  updateView: () => {
    throw new Error('likec4rpc.updateView is not available in production')
  },
  calcAdhocView: () => {
    throw new Error('likec4rpc.calcAdhocView is not available in production')
  },
}


if (import.meta.hot) {
  likec4rpc = createRpc({
    send: (event, data) => {
      import.meta.hot.send(event, data)
    },
    on: (event, fn) => {
      import.meta.hot.on(event, fn)
    }
  })
  import.meta.hot.accept()
}


`

const nonRpcCode = () =>
  ` 
export const isRpcAvailable = false
export const isAIAvailable = false
export const AIAdapter = undefined

export const likec4rpc = {
  applySemanticLayout: () => {
    throw new Error('likec4rpc.applySemanticLayout is not available in production')
  },
  updateView: () => {
    throw new Error('likec4rpc.updateView is not available in production')
  },
  calcAdhocView: () => {
    throw new Error('likec4rpc.calcAdhocView is not available in production')
  },
}
`

export const rpcModule: VirtualModule = {
  id: 'likec4:rpc',
  virtualId: 'likec4:plugin/rpc.js',
  async load(opts) {
    if (opts.rpcEnabled) {
      logGenerating('rpc')
      return {
        code: rpcCode(opts),
        moduleType: 'js',
        moduleSideEffects: false,
      }
    }
    return {
      code: nonRpcCode(),
      moduleType: 'js',
      moduleSideEffects: false,
    }
  },
}

import k from 'tinyrainbow'
import type { VirtualModule } from './_shared'

const code = ` 
import { createRpc} from 'likec4/vite-plugin/internal'

export const likec4rpc = import.meta.hot
  ? createRpc({
      send: (event, data) => {
        import.meta.hot.send(event, data)
      },
      on: (event, fn) => {
        import.meta.hot.on(event, fn)
      }
    })
  : {
    updateView: () => {
      throw new Error('likec4rpc.updateView is not available in production')
    },
    calcAdhocView: () => {
      throw new Error('likec4rpc.calcAdhocView is not available in production')
    },
  }

Object.defineProperty(likec4rpc, 'isAvailable', {
  enumerable: true,
  get() {
    return !!import.meta.hot
  },
})

import.meta.hot?.accept()
`

export const rpcModule: VirtualModule = {
  id: 'likec4:rpc',
  virtualId: 'likec4:plugin/rpc.js',
  async load({ logger }) {
    logger.info(k.dim('generating likec4:rpc'))
    return code
  },
}

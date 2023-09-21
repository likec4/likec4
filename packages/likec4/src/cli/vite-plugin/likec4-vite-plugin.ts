import type { Plugin, ViteDevServer } from 'vite'
import { generateViewsDataTs } from '@likec4/generators'

let seq = 1
const code = () => `
const LikeC4Views = {
  v1: "seq${seq++}",
  v2: "v2",
}
export default LikeC4Views
`

export function likeC4VitePlugin(): Plugin {
  const virtualModuleId = 'virtual:likec4-views'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  let _server: ViteDevServer | undefined

  let interval: NodeJS.Timeout | undefined

  const start = () => {
    interval = setInterval(() => {
      console.log('reloadModule')
      const md = _server?.moduleGraph.getModuleById(resolvedVirtualModuleId)
      if (md) {
        _server?.reloadModule(md)
      }
    }, 5000)
  }

  return {
    name: 'likec4-plugin', // required, will show up in warnings and errors
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return
    },
    load(id) {
      console.log('load')
      if (id === resolvedVirtualModuleId) {
        return code()
      }
      return
    },
    configureServer(server) {
      _server = server
      start()
      console.log('configureServer')
    },
    buildStart() {
      console.log('buildStart')
    },
    buildEnd() {
      console.log('buildEnd')
    }
  }
}

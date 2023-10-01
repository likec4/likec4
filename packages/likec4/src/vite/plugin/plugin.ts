import { generateViewsDataJs } from '@likec4/generators'
import type { Plugin } from 'vite'
import type { LanguageServices } from '../../language-services'

export type LikeC4PluginOptions = {
  languageServices: LanguageServices
}

const moduleId = '~likec4'
// const resolvedVirtualModuleId = '\0likec4'
const resolvedVirtualModuleId = '/@vite-plugin-likec4/likec4-generated'

const isTarget = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4')
}

export function likec4Plugin({ languageServices: likec4 }: LikeC4PluginOptions): Plugin {
  let _generatedCode: string | null = null

  async function generateCode() {
    const views = await likec4.getViews()
    return generateViewsDataJs(views)
  }

  return {
    name: 'vite-plugin-likec4',

    resolveId(id) {
      if (id === moduleId) {
        return resolvedVirtualModuleId
      }
      return
    },

    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const code = (_generatedCode ??= await generateCode())
        return code
      }
      return null
    },

    configureServer(server) {
      const triggerHMR = () => {
        _generatedCode = null
        const md = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (md) {
          // logDebug(`trigger HMR: ${md.url}`)
          void server.reloadModule(md)
        } else {
          // ctx.logger.warnOnce(
          //   'LikeC4 HMR is not available because the module has not been loaded yet.'
          // )
        }
      }
      let pending: NodeJS.Timeout
      const scheduleHMR = () => {
        clearTimeout(pending)
        pending = setTimeout(triggerHMR, 300)
      }

      const handleUpdate = (task: Promise<boolean>) => {
        clearTimeout(pending)
        task.then(
          result => result && scheduleHMR(),
          () => ({})
        )
      }

      server.watcher
        .on('add', path => {
          if (isTarget(path)) {
            handleUpdate(likec4.notifyUpdate({ changed: path }))
          }
        })
        .on('change', path => {
          if (isTarget(path)) {
            handleUpdate(likec4.notifyUpdate({ changed: path }))
          }
        })
        .on('unlink', path => {
          if (isTarget(path)) {
            handleUpdate(likec4.notifyUpdate({ removed: path }))
          }
        })
    }
  }
}

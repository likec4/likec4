import { generateViewsDataJs } from '@likec4/generators'
import type { Logger, Plugin } from 'vite'
import type { LanguageServices } from '../language-services'

export type LikeC4PluginOptions = {
  languageServices: LanguageServices
}

const moduleId = '~likec4'
const resolvedVirtualModuleId = '/@vite-plugin-likec4/likec4-generated'

const isTarget = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

export function likec4Plugin({ languageServices: likec4 }: LikeC4PluginOptions): Plugin {
  let _generatedCode: string | null = null
  let logger: Logger

  async function generateCode() {
    const views = await likec4.getViews()
    return generateViewsDataJs(views)
  }

  return {
    name: 'vite-plugin-likec4',

    configResolved(config) {
      logger = config.logger
    },

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
          logger.info(`trigger HMR: ${md.url}`)
          void server.reloadModule(md)
        } else {
          logger.warn(`LikeC4 HMR is not available because the module has not been loaded yet.`)
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

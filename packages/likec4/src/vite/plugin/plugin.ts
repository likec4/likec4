import type { Logger, Plugin, ResolvedConfig } from 'vite'
import { LanguageServices } from './language-services'
import { debounce } from 'rambdax'

export type LikeC4PluginOptions = {
  /**
   * likec4 workspace or current directory
   */
  workspace?: string
}

const moduleId = '~likec4'
// const resolvedVirtualModuleId = '\0likec4'
const resolvedVirtualModuleId = '/@vite-plugin-likec4/likec4-generated'

const isTarget = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4')
}

type LikeC4PluginContext = {
  logger: Logger
  likec4: LanguageServices
}

export function likec4Plugin(opts: LikeC4PluginOptions = {}): Plugin {
  let ctx: LikeC4PluginContext

  return {
    name: 'vite-plugin-likec4',
    configResolved: {
      order: 'pre',
      async handler(config: ResolvedConfig) {
        ctx = {
          logger: config.logger,
          likec4: LanguageServices.create(config.logger)
        }
        await ctx.likec4.init(opts.workspace || config.root)
      }
    },

    resolveId(id) {
      if (id === moduleId) {
        return resolvedVirtualModuleId
      }
      return
    },

    async load(id) {
      if (id === resolvedVirtualModuleId) {
        return await ctx.likec4.generateCode()
      }
      return null
    },

    configureServer(server) {
      const triggerHMR = debounce((_ = '') => {
        const md = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (md) {
          ctx.logger.info('triggerHMR')
          void server.reloadModule(md)
        } else {
          ctx.logger.warnOnce('LikeC4 HMR is not available because the module has not been loaded yet.')
        }
      }, 300)

      server.watcher
        .on('add', path => {
          if (isTarget(path)) {
            ctx.likec4.watcher.changed(path)
            triggerHMR(undefined)
          }
        })
        .on('change', path => {
          if (isTarget(path)) {
            ctx.likec4.watcher.changed(path)
            triggerHMR(undefined)
          }
        })
        .on('unlink', path => {
          if (isTarget(path)) {
            ctx.likec4.watcher.deleted(path)
            triggerHMR(undefined)
          }
        })
    }
  }
}

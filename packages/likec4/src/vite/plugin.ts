import { invariant } from '@likec4/core'
import { generateViewsDataJs } from '@likec4/generators'
import pDebounce from 'p-debounce'
import { values } from 'remeda'
import type { PluginOption } from 'vite'
import type { LanguageServices } from '../language-services'
import type { Logger } from '../logger'
import { generateD2Sources, generateDotSources, generateMmdSources } from './generators'

export type LikeC4PluginOptions = {
  languageServices: LanguageServices
}

interface Module {
  id: string
  virtualId: string

  load(opts: { logger: Logger; likec4: LanguageServices }): Promise<string>
}

const generatedViews = {
  id: 'virtual:likec4/views',
  virtualId: '/@vite-plugin-likec4/likec4-views',
  async load({ likec4, logger }) {
    logger.info('generating virtual:likec4/views')
    const views = await likec4.getViews()
    return generateViewsDataJs(views)
  }
} satisfies Module

const dimensionsModule = {
  id: 'virtual:likec4/dimensions',
  virtualId: '\0likec4/dimensions',
  // virtualId: '/@vite-plugin-likec4/likec4-dimensions.ts',
  async load({ likec4, logger }) {
    logger.info('generating virtual:likec4/dimensions')
    const views = await likec4.getViews()
    let code = `export const LikeC4Views = {\n`
    for (const view of views) {
      code += `  ${JSON.stringify(view.id)}: {width: ${view.width},height: ${view.height}},\n`
    }
    code += `}`
    return code
  }
} satisfies Module

const dotSourcesModule = {
  id: 'virtual:likec4/dot-sources',
  virtualId: '\0likec4/dot-sources',
  // virtualId: '/@vite-plugin-likec4/likec4-dot-sources.ts',
  async load({ likec4, logger }) {
    logger.info('generating virtual:likec4/dot-sources')
    const dotSources = await likec4.getViewsAsDot()
    const sources = {} as Record<
      string,
      {
        dot: string
        svg: string
      }
    >
    for (const [viewId, dot] of Object.entries(dotSources)) {
      sources[viewId] = {
        dot,
        svg: await likec4.dotlayouter.svg(dot)
      }
    }
    return generateDotSources(sources)
  }
} satisfies Module

const d2SourcesModule = {
  id: 'virtual:likec4/d2-sources',
  virtualId: '\0likec4/d2-sources',
  async load({ likec4, logger }) {
    await Promise.resolve()
    logger.info('generating virtual:likec4/d2-sources')
    const views = likec4.getModel()?.views
    invariant(views, 'views must be defined')
    return generateD2Sources(values(views))
  }
} satisfies Module

const mmdSourcesModule = {
  id: 'virtual:likec4/mmd-sources',
  virtualId: '\0likec4/mmd-sources',
  // virtualId: '/@vite-plugin-likec4/likec4-mmd-sources.ts',
  async load({ likec4, logger }) {
    await Promise.resolve()
    logger.info('generating virtual:likec4/mmd-sources')
    const views = likec4.getModel()?.views
    invariant(views, 'views must be defined')
    return generateMmdSources(values(views))
  }
} satisfies Module

const modules = [
  generatedViews,
  dimensionsModule,
  dotSourcesModule,
  d2SourcesModule,
  mmdSourcesModule
] as const

const isTarget = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

export function likec4Plugin({ languageServices: likec4 }: LikeC4PluginOptions): PluginOption {
  let logger: Logger

  return {
    name: 'vite-plugin-likec4',

    configResolved(config) {
      logger = config.logger
    },

    resolveId: {
      order: 'pre',
      handler(id) {
        const module = modules.find(m => m.id === id)
        if (module) {
          return module.virtualId
        }
        return null
      }
    },

    async load(id) {
      const module = modules.find(m => m.virtualId === id)
      if (module) {
        return await module.load({ logger, likec4 })
      }
      return null
    },

    configureServer(server) {
      const triggerHMR = async () => {
        const [error] = likec4.getValidationDiagnostics()
        if (error) {
          server.ws.send({
            type: 'error',
            err: {
              message: 'Validation error:\n\n' + error.message,
              stack: '',
              plugin: 'vite-plugin-likec4',
              loc: {
                file: error.source,
                line: error.range.start.line + 1,
                column: error.range.start.character + 1
              }
            }
          })
          return
        }

        const reload = modules
          .flatMap(m => {
            const md = server.moduleGraph.getModuleById(m.virtualId)
            return md ? [md] : []
          })
          .map(md => {
            logger.info(`trigger HMR: ${md.url}`)
            return server.reloadModule(md).catch(err => {
              server.ws.send({ type: 'error', err })
              logger.error(err)
            })
          })
        await Promise.all(reload)
        return
      }
      const scheduleHMR = pDebounce(triggerHMR, 200)

      const handleUpdate = (task: Promise<boolean>) => {
        task.then(() => scheduleHMR()).catch(err => server.ws.send({ type: 'error', err }))
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

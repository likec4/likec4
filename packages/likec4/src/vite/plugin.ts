import { generateViewsDataJs } from '@likec4/generators'
import pLimit from 'p-limit'
import k from 'picocolors'
import { mapToObj } from 'remeda'
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
    logger.info(k.dim('generating virtual:likec4/views'))
    const diagrams = await likec4.views.diagrams()
    return generateViewsDataJs([...diagrams])
  }
} satisfies Module

const dimensionsModule = {
  id: 'virtual:likec4/dimensions',
  virtualId: '\0likec4/dimensions',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/dimensions'))
    const views = await likec4.views.diagrams()
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
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/dot-sources'))
    const views = await likec4.views.viewsAsGraphvizOut()
    const sources = mapToObj(views, ({ id, svg, dot }) => [id, { dot, svg }])
    return generateDotSources(sources)
  }
} satisfies Module

const d2SourcesModule = {
  id: 'virtual:likec4/d2-sources',
  virtualId: '\0likec4/d2-sources',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/d2-sources'))
    const views = await likec4.views.computedViews()
    return generateD2Sources(views)
  }
} satisfies Module

const mmdSourcesModule = {
  id: 'virtual:likec4/mmd-sources',
  virtualId: '\0likec4/mmd-sources',
  // virtualId: '/@vite-plugin-likec4/likec4-mmd-sources.ts',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/mmd-sources'))
    const views = await likec4.views.computedViews()
    return generateMmdSources(views)
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
      const limit = pLimit(1)
      const triggerHMR = () =>
        limit(async () => {
          const [error] = likec4.getErrors()
          if (error) {
            server.ws.send({
              type: 'error',
              err: {
                message: 'Validation error:\n\n' + error.message,
                stack: '',
                plugin: 'vite-plugin-likec4',
                loc: {
                  file: error.sourceFsPath,
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
              return md && md.importers.size > 0 ? [md] : []
            })
            .map(async md => {
              logger.info(`${k.green('trigger hmr')} ${k.dim(md.url)}`)
              return server.reloadModule(md).catch(err => {
                server.ws.send({ type: 'error', err })
                logger.error(err)
              })
            })
          await Promise.allSettled(reload)
          return
        })

      const pattern = likec4.workspace
      logger.info(`${k.dim('watch')} ${pattern}`)

      server.watcher
        .add(pattern)
        .on('add', path => {
          if (isTarget(path)) {
            likec4.notifyUpdate({ changed: path })
          }
        })
        .on('change', path => {
          if (isTarget(path)) {
            likec4.notifyUpdate({ changed: path })
          }
        })
        .on('unlink', path => {
          if (isTarget(path)) {
            likec4.notifyUpdate({ removed: path })
          }
        })

      likec4.onModelUpdate(() => {
        triggerHMR().catch(err => logger.error(err))
      })
    }
  }
}

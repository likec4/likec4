import { generateViewsDataJs } from '@likec4/generators'
import { consola } from '@likec4/log'
import pLimit from 'p-limit'
import { mapToObj } from 'remeda'
import k from 'tinyrainbow'
import type { PluginOption } from 'vite'
import type { LikeC4 } from '../LikeC4'
import type { ViteLogger } from '../logger'
import {
  diagramPreviewsSources,
  generateD2Sources,
  generateDotSources,
  generateIconRendererSource,
  generateMmdSources,
  generateOverviewGraphSource,
  storeSource
} from './generators'

export type LikeC4PluginOptions = {
  languageServices: LikeC4
  useOverviewGraph?: boolean
}

interface Module {
  id: string
  virtualId: string

  load(opts: {
    logger: ViteLogger
    likec4: LikeC4
    assetsDir: string
    useOverviewGraph?: boolean
  }): Promise<string>
}

const generatedStore = {
  id: 'virtual:likec4/store',
  virtualId: '\0likec4-plugin/store.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/store'))
    return storeSource
  }
} satisfies Module

const generatedViews = {
  id: 'virtual:likec4/views',
  virtualId: '\0likec4-plugin/views.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/views'))
    const diagrams = await likec4.views.diagrams()
    return generateViewsDataJs([...diagrams])
  }
} satisfies Module

const dotSourcesModule = {
  id: 'virtual:likec4/dot-sources',
  virtualId: '\0likec4-plugin/dot-sources.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/dot-sources'))
    const views = await likec4.views.viewsAsGraphvizOut()
    const sources = mapToObj(views, ({ id, svg, dot }) => [id, { dot, svg }])
    return generateDotSources(sources)
  }
} satisfies Module

const d2SourcesModule = {
  id: 'virtual:likec4/d2-sources',
  virtualId: '\0likec4-plugin/d2-sources.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/d2-sources'))
    const views = await likec4.views.computedViews()
    return generateD2Sources(views)
  }
} satisfies Module

const mmdSourcesModule = {
  id: 'virtual:likec4/mmd-sources',
  virtualId: '\0likec4-plugin/mmd-sources.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/mmd-sources'))
    const views = await likec4.views.computedViews()
    return generateMmdSources(views)
  }
} satisfies Module

const iconsModule = {
  id: 'virtual:likec4/icons',
  virtualId: '\0likec4-plugin/icons.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/icons'))
    const views = await likec4.views.computedViews()
    return generateIconRendererSource(views)
  }
} satisfies Module

const overviewGraphModule = {
  id: 'virtual:likec4/overview-graph',
  virtualId: '\0likec4-plugin/overview-graph.js',
  async load({ likec4, logger, useOverviewGraph }) {
    if (useOverviewGraph === true) {
      logger.info(k.dim('generating virtual:likec4/overview-graph'))
      const overview = await likec4.views.overviewGraph()
      return generateOverviewGraphSource(overview)
    }
    logger.info(k.dim('generating empty virtual:likec4/overview-graph'))
    return generateOverviewGraphSource({
      nodes: [],
      edges: [],
      bounds: { x: 0, y: 0, width: 10, height: 10 }
    })
  }
} satisfies Module

const previewsModule = {
  id: 'virtual:likec4/previews',
  virtualId: '\0likec4-plugin/previews.js',
  async load({ likec4, logger, assetsDir }) {
    logger.info(k.dim('generating virtual:likec4/previews'))
    const views = await likec4.views.computedViews()
    return diagramPreviewsSources(views, assetsDir)
  }
} satisfies Module

const hmrmodules = [
  iconsModule,
  dotSourcesModule,
  d2SourcesModule,
  mmdSourcesModule,
  generatedViews,
  overviewGraphModule,
  previewsModule
]

export const modules = [
  ...hmrmodules,
  generatedStore
]

const isTarget = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

export function likec4Plugin({
  useOverviewGraph = false,
  languageServices: likec4
}: LikeC4PluginOptions): PluginOption {
  let logger: ViteLogger
  let assetsDir = likec4.workspace

  return {
    name: 'vite-plugin-likec4',

    configResolved(config) {
      logger = config.logger
      if (useOverviewGraph) {
        const resolvedAlias = config.resolve.alias.find(a => a.find === 'likec4/previews')?.replacement
        if (resolvedAlias) {
          assetsDir = resolvedAlias
          logger.info(k.dim('likec4/previews alias') + ' ' + k.dim(assetsDir))
        } else {
          logger.warn('likec4/previews alias not found')
        }
      }
    },

    resolveId(id) {
      const module = modules.find(m => m.id === id)
      if (module) {
        return module.virtualId
      }
      return null
    },

    async load(id) {
      const module = modules.find(m => m.virtualId === id)
      if (module) {
        return await module.load({
          logger,
          likec4,
          assetsDir,
          useOverviewGraph: useOverviewGraph
        })
      }
      return null
    },

    configureServer(server) {
      const limit = pLimit(1)
      const triggerHMR = () => {
        limit.clearQueue()
        void limit(async () => {
          const [error] = likec4.getErrors()
          if (error) {
            server.ws.send({
              type: 'error',
              err: {
                name: 'LikeC4ValidationError',
                message: 'Validation error: ' + error.message.slice(0, 500),
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
          for (const module of hmrmodules) {
            const md = server.moduleGraph.getModuleById(module.virtualId)
            if (md && md.importers.size > 0) {
              logger.info(`${k.green('trigger hmr')} ${k.dim(md.url)}`)
              try {
                await server.reloadModule(md)
              } catch (err) {
                logger.error(err)
              }
            }
          }
          return
        })
      }

      const pattern = likec4.workspace
      logger.info(`${k.dim('watch')} ${pattern}`)
      const notifyUpdate = (updated: 'changed' | 'removed') => (path: string) => {
        if (isTarget(path)) {
          likec4.notifyUpdate({ [updated]: path })
        }
      }
      server.watcher
        .add(pattern)
        .on('add', notifyUpdate('changed'))
        .on('change', notifyUpdate('changed'))
        .on('unlink', notifyUpdate('removed'))

      if (useOverviewGraph && !assetsDir.startsWith(likec4.workspace)) {
        logger.info(`${k.dim('watch')} ${assetsDir}`)
        const reloadPreviews = () => {
          const md = server.moduleGraph.getModuleById(previewsModule.virtualId)
          if (md && md.importers.size > 0) {
            server.reloadModule(md)
          }
        }
        server.watcher.add(assetsDir)
          .on('add', reloadPreviews)
          .on('change', reloadPreviews)
          .on('unlink', reloadPreviews)
      }

      likec4.onModelUpdate(() => {
        consola.debug('likec4 model update')
        triggerHMR()
      })
    }
  }
}

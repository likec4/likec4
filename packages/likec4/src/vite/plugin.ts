import { generateViewsDataTs } from '@likec4/generators'
import type { PluginOption } from 'vite'
import type { LanguageServices } from '../language-services'
import { generateD2Sources, generateDotSources, generateMmdSources } from './generators'
import pDebounce from 'p-debounce'
import type { Logger } from '../logger'
import { invariant } from '@likec4/core'
import { values } from 'remeda'

export type LikeC4PluginOptions = {
  languageServices: LanguageServices
}

interface Module {
  id: string
  virtualId: string

  load(opts: { logger: Logger; likec4: LanguageServices }): Promise<string>
}

const generatedViews = {
  id: '~likec4',
  virtualId: '/@vite-plugin-likec4/likec4-generated.ts',
  async load({ likec4, logger }) {
    logger.info('generating ~likec4')
    const views = await likec4.getViews()
    return generateViewsDataTs(views)
  }
} satisfies Module

const dimensionsModule = {
  id: '~likec4-dimensions',
  virtualId: '/@vite-plugin-likec4/likec4-dimensions.ts',
  async load({ likec4, logger }) {
    logger.info('generating ~likec4-dimensions')
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
  id: '~likec4-dot-sources',
  virtualId: '/@vite-plugin-likec4/likec4-dot-sources.tsx',
  async load({ likec4, logger }) {
    logger.info('generating ~likec4-dot-sources')
    const dotSources = await likec4.getViewsAsDot()
    return generateDotSources(dotSources)
  }
} satisfies Module

const d2SourcesModule = {
  id: '~likec4-d2-sources',
  virtualId: '/@vite-plugin-likec4/likec4-d2-sources.tsx',
  async load({ likec4, logger }) {
    await Promise.resolve()
    logger.info('generating ~likec4-d2-sources')
    const views = likec4.getModel()?.views
    invariant(views, 'views must be defined')
    return generateD2Sources(values(views))
  }
} satisfies Module

const mmdSourcesModule = {
  id: '~likec4-mmd-sources',
  virtualId: '/@vite-plugin-likec4/likec4-mmd-sources.tsx',
  async load({ likec4, logger }) {
    await Promise.resolve()
    logger.info('generating ~likec4-mmd-sources')
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
        return await module.load({ logger, likec4 })
      }
      return null
    },

    configureServer(server) {
      const triggerHMR = async () => {
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
        task
          .then(result => (result ? scheduleHMR() : null))
          .catch(err => server.ws.send({ type: 'error', err }))
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

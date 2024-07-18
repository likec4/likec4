import { generateViewsDataJs } from '@likec4/generators'
import consola from 'consola'
import pLimit from 'p-limit'
import k from 'picocolors'
import { filter, isString, map, mapToObj, pipe, unique } from 'remeda'
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

const generatedStore = {
  id: 'virtual:likec4',
  virtualId: '/@vite-plugin-likec4/store',
  async load({ logger }) {
    logger.info(k.dim('generating virtual:likec4'))
    return `
import { map } from 'nanostores'
import { LikeC4Views } from 'virtual:likec4/views'

let keys = new Set(Object.keys(LikeC4Views))
export const $views = map(LikeC4Views)

if (import.meta.env.DEV) {
  import.meta.hot?.accept('/@vite-plugin-likec4/views', md => {
    const update = md?.LikeC4Views
    if (update) {
      const currents = $views.get()
      let newKeys = new Set()
      for (const [id, view] of Object.entries(update)) {
        newKeys.add(id)
        $views.setKey(id, view)
      }
      for (const key of keys) {
        if (!newKeys.has(key)) {
          $views.setKey(key, undefined)
        }
      }
      keys = newKeys
    }
  })
}
`
  }
} satisfies Module

const generatedViews = {
  id: 'virtual:likec4/views',
  virtualId: '/@vite-plugin-likec4/views.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/views'))
    const diagrams = await likec4.views.diagrams()
    return generateViewsDataJs([...diagrams])
  }
} satisfies Module

const dotSourcesModule = {
  id: 'virtual:likec4/dot-sources',
  virtualId: '/@vite-plugin-likec4/dot-sources.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/dot-sources'))
    const views = await likec4.views.viewsAsGraphvizOut()
    const sources = mapToObj(views, ({ id, svg, dot }) => [id, { dot, svg }])
    return generateDotSources(sources)
  }
} satisfies Module

const d2SourcesModule = {
  id: 'virtual:likec4/d2-sources',
  virtualId: '/@vite-plugin-likec4/d2-sources.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/d2-sources'))
    const views = await likec4.views.computedViews()
    return generateD2Sources(views)
  }
} satisfies Module

const mmdSourcesModule = {
  id: 'virtual:likec4/mmd-sources',
  virtualId: '/@vite-plugin-likec4/mmd-sources.js',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/mmd-sources'))
    const views = await likec4.views.computedViews()
    return generateMmdSources(views)
  }
} satisfies Module

const iconsModule = {
  id: 'virtual:likec4/icon-renderer',
  virtualId: '/@vite-plugin-likec4/icon-renderer.jsx',
  async load({ likec4, logger }) {
    logger.info(k.dim('generating virtual:likec4/icon-renderer'))
    const views = await likec4.views.computedViews()
    const icons = pipe(
      views.flatMap(v => v.nodes.map(n => n.icon)),
      filter((s: any): s is string => isString(s) && !!s.match(/^(aws|gcp|tech):/)),
      unique(),
      map(s => {
        const [group, fname] = s.split(':') as ['aws' | 'gcp' | 'tech', string]

        const cmpName = [
          group[0]!.toUpperCase(),
          group.substring(1),
          fname[0]!.toUpperCase(),
          fname.substring(1).replaceAll('-', '').replaceAll('_', '')
        ].join('')

        return [
          group,
          fname,
          cmpName
        ] as const
      })
    )

    if (icons.length === 0) {
      return `
export default function IconRenderer() {
  return null
}
      `
    }

    const imports = icons.map(([group, fname, cmp]) => {
      return `import ${cmp} from '@likec4/icons/${group}/${fname}'`
    }).join('\n')

    const cases = icons.flatMap(([group, fname, cmp]) => {
      return [
        `     case '${group}:${fname}':`,
        `       return <${cmp} />`
      ]
    }).join('\n')

    return `
${imports}

export default function IconRenderer({node}) {
  if (!node.icon) {
    return null
  }
  switch (node.icon) {
${cases}
  }
  return null
}
`
  }
} satisfies Module

export const modules = [
  generatedViews,
  dotSourcesModule,
  d2SourcesModule,
  mmdSourcesModule,
  iconsModule
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
        if (id === generatedStore.id) {
          return generatedStore.virtualId
        }
        const module = modules.find(m => m.id === id)
        if (module) {
          return module.virtualId
        }
        return null
      }
    },

    async load(id) {
      if (id === generatedStore.virtualId) {
        return await generatedStore.load({ logger, likec4 })
      }
      const module = modules.find(m => m.virtualId === id)
      if (module) {
        return await module.load({ logger, likec4 })
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
            server.hot.send({
              type: 'error',
              err: {
                name: 'LikeC4ValidationError',
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
          for (const module of modules) {
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
        consola.debug('likec4 model update')
        triggerHMR()
      })
    }
  }
}

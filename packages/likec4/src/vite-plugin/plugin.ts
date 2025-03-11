import type { ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import k from 'tinyrainbow'
import type { PluginOption } from 'vite'
import { LikeC4 } from '../LikeC4'
import type { ViteLogger } from '../logger'
import { d2Module, projectD2Module } from './virtuals/d2'
import { dotModule, projectDotSourcesModule } from './virtuals/dot'
import { iconsModule, projectIconsModule } from './virtuals/icons'
import { mmdModule, projectMmdSourcesModule } from './virtuals/mmd'
import { modelModule, projectModelModule } from './virtuals/model'
import { projectsModule } from './virtuals/projects'
import { reactModule } from './virtuals/react'
import { singleProjectModule } from './virtuals/single-project'

export type LikeC4VitePluginOptions = {
  /**
   * Initializes a LikeC4 instance from the specified workspace path.
   * By default it is vite project root.
   */
  workspace?: string
  /**
   * By default, if LikeC4 model is invalid, errors are printed to the console.
   * Disable this behavior by setting this option to false.
   *
   * @default true
   */
  printErrors?: boolean
  /**
   * If true, initialization will return rejected promise with the LikeC4 instance.
   * Use `likec4.getErrors()` to get the errors.
   * @default false
   */
  throwIfInvalid?: boolean
  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * If you have instance of {@link LikeC4}
   * you can pass `languageServices` from it.
   */
  languageServices?: LikeC4LanguageServices

  /**
   * @deprecated
   */
  useOverviewGraph?: boolean
} | {
  languageServices: LikeC4LanguageServices
  workspace?: never
  printErrors?: never
  throwIfInvalid?: never
  graphviz?: never
  useOverviewGraph?: boolean
}

const projectVirtuals = [
  projectModelModule,
  projectIconsModule,
  projectD2Module,
  projectDotSourcesModule,
  projectMmdSourcesModule,
]

const virtuals = [
  projectsModule,
  modelModule,
  singleProjectModule,
  reactModule,
  d2Module,
  dotModule,
  mmdModule,
  iconsModule,
]

const isTarget = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

export function LikeC4VitePlugin({
  useOverviewGraph = false,
  ...opts
}: LikeC4VitePluginOptions): any {
  let logger: ViteLogger
  let likec4: LikeC4LanguageServices
  let assetsDir: string

  return {
    name: 'vite-plugin-likec4',

    async configResolved(config) {
      logger = config.logger
      if (useOverviewGraph === true) {
        const resolvedAlias = config.resolve.alias.find(a => a.find === 'likec4/previews')?.replacement
        if (resolvedAlias) {
          assetsDir = resolvedAlias
          logger.info(k.dim('likec4/previews alias') + ' ' + k.dim(assetsDir))
        } else {
          logger.warn('likec4/previews alias not found')
        }
      }
      if (opts.languageServices) {
        likec4 = opts.languageServices
      } else {
        const instance = await LikeC4.fromWorkspace(opts.workspace ?? config.root, {
          graphviz: opts.graphviz ?? 'wasm',
          printErrors: opts.printErrors ?? true,
          throwIfInvalid: opts.throwIfInvalid ?? false,
        })
        likec4 = instance.languageServices
      }
      assetsDir = likec4.workspaceUri.fsPath
    },

    resolveId(id) {
      for (const module of projectVirtuals) {
        const projectId = module.matches(id)
        if (projectId) {
          return module.virtualId(projectId)
        }
      }
      for (const module of virtuals) {
        if (module.id === id) {
          return module.virtualId
        }
      }
      return null
    },

    async load(id) {
      for (const module of projectVirtuals) {
        const projectId = module.matches(id)
        if (projectId) {
          return await module.load({
            logger,
            likec4,
            projectId: projectId as ProjectId,
            assetsDir,
            useOverviewGraph,
          })
        }
      }
      for (const module of virtuals) {
        if (module.virtualId === id) {
          const projects = await likec4.projects()
          return await module.load({
            logger,
            likec4,
            projects,
            assetsDir,
            useOverviewGraph,
          })
        }
      }
      return null
    },

    configureServer(server) {
      const patterns = likec4.projects().map(({ folder }) => folder.fsPath)
      for (const pattern of patterns) {
        logger.info(`${k.dim('watch')} ${pattern}`)
      }
      const notifyUpdate = (updated: 'changed' | 'removed') => (path: string) => {
        if (isTarget(path)) {
          likec4.notifyUpdate({ [updated]: path })
        }
      }
      server.watcher
        .add(patterns)
        .on('add', notifyUpdate('changed'))
        .on('change', notifyUpdate('changed'))
        .on('unlink', notifyUpdate('removed'))

      likec4.builder.onModelParsed(async () => {
        for (const project of likec4.projects()) {
          for (const projectModule of projectVirtuals) {
            const md = server.moduleGraph.getModuleById(projectModule.virtualId(project.id))
            if (md && md.importers.size > 0) {
              logger.info(`${k.green('trigger hmr')} ${k.dim(md.url)}`)
              try {
                await server.reloadModule(md)
              } catch (err) {
                logger.error(err)
              }
            }
          }
        }
      })
    },
  } satisfies PluginOption
}

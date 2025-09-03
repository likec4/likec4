import { invariant, isNonEmptyArray } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { relative } from 'node:path'
import { isDeepEqual } from 'remeda'
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
import { projectPumlModule, pumlModule } from './virtuals/puml'
import { projectReactModule, singleProjectReactModule } from './virtuals/react'
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
   * Whether to watch for changes in the workspace.
   * @default true if vite mode is 'development', false otherwise
   */
  watch?: boolean

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
  watch?: never
  useOverviewGraph?: boolean
}

const hmrProjectVirtuals = [
  projectModelModule,
  projectIconsModule,
  projectD2Module,
  projectDotSourcesModule,
  projectMmdSourcesModule,
  projectPumlModule,
]
const projectVirtuals = [
  ...hmrProjectVirtuals,
  projectReactModule,
]

const virtuals = [
  projectsModule,
  modelModule,
  singleProjectModule,
  singleProjectReactModule,
  d2Module,
  dotModule,
  mmdModule,
  pumlModule,
  iconsModule,
]

export function LikeC4VitePlugin({
  useOverviewGraph = false,
  ...opts
}: LikeC4VitePluginOptions): any {
  let viteRoot: string
  let logger: ViteLogger
  let likec4: LikeC4LanguageServices
  let assetsDir: string

  let shouldDisposeOnStop = opts.watch ?? false

  return {
    name: 'vite-plugin-likec4',

    async configResolved(config) {
      viteRoot = config.root
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
        const watch = shouldDisposeOnStop = opts.watch ?? config.mode === 'development'
        const instance = await LikeC4.fromWorkspace(opts.workspace ?? config.root, {
          logger,
          graphviz: opts.graphviz ?? 'wasm',
          printErrors: opts.printErrors ?? true,
          throwIfInvalid: opts.throwIfInvalid ?? false,
          watch,
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
          const project = likec4.project(projectId)
          return await module.load({
            logger,
            likec4,
            project,
            assetsDir,
            useOverviewGraph,
          })
        }
      }
      for (const module of virtuals) {
        if (module.virtualId === id) {
          const projects = likec4.projects()
          invariant(isNonEmptyArray(projects))

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
      let _projects = likec4.projects()

      const reloadModule = async (id: string) => {
        const md = server.moduleGraph.getModuleById(id)
        if (md && md.importers.size > 0) {
          logger.info(`${k.green('reload')} ${k.dim(md.id ?? md.url)}`)
          try {
            await server.reloadModule(md)
          } catch (err) {
            logger.error(err)
          }
        }
      }

      likec4.builder.onModelParsed(async () => {
        const [error] = likec4.getErrors()
        if (error) {
          server.ws.send({
            type: 'error',
            err: {
              name: 'LikeC4ValidationError',
              message: 'Validation failed\n' + error.message.slice(0, 500),
              stack: '',
              plugin: 'vite-plugin-likec4',
              loc: {
                file: relative(viteRoot, error.sourceFsPath),
                line: error.range.start.line + 1,
                column: error.range.start.character + 1,
              },
            },
          })
          return
        }
        const _updated = likec4.projects()
        if (!isDeepEqual(_updated, _projects)) {
          _projects = _updated
          await reloadModule(projectsModule.virtualId)
          await reloadModule(modelModule.virtualId)
        }

        for (const project of _projects) {
          for (const projectModule of hmrProjectVirtuals) {
            await reloadModule(projectModule.virtualId(project.id))
          }
        }
      })
    },

    async buildEnd() {
      if (shouldDisposeOnStop) {
        await likec4.dispose()
      }
    },
  } satisfies PluginOption
}

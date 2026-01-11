import { invariant, isNonEmptyArray } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { isDeepEqual, map } from 'remeda'
import k from 'tinyrainbow'
import type {
  Plugin,
  PluginOption,
} from 'vite'
import { LikeC4 } from '../LikeC4'
import type { ViteLogger } from '../logger'
import { enablePluginRPC } from './rpc'
import { d2Module, projectD2Module } from './virtuals/d2'
import { dotModule, projectDotSourcesModule } from './virtuals/dot'
import { iconsModule, projectIconsModule } from './virtuals/icons'
import { mmdModule, projectMmdSourcesModule } from './virtuals/mmd'
import { modelModule, projectModelModule } from './virtuals/model'
import { projectsModule } from './virtuals/projects'
import { projectsOverviewModule } from './virtuals/projectsOverview'
import { projectPumlModule, pumlModule } from './virtuals/puml'
import { projectReactModule, singleProjectReactModule } from './virtuals/react'
import { rpcModule } from './virtuals/rpc'
import { singleProjectModule } from './virtuals/single-project'

type SharedOptions = {
  /**
   * Define vite environments where this plugin should be active
   * By default, the plugin is active in all environments
   */
  environments?: string | string[]
}

export type LikeC4VitePluginOptions =
  & SharedOptions
  & ({
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
     * Whether to watch for changes in the workspace.
     * @default true if vite mode is 'development', false otherwise
     */
    watch?: boolean

    /**
     * @deprecated
     */
    useOverviewGraph?: boolean

    // This option is not allowed when using `workspace`
    languageServices?: never
  } | {
    /**
     * If you have instance of {@link LikeC4}
     * you can pass `languageServices` from it.
     */
    languageServices: LikeC4LanguageServices
    workspace?: never
    printErrors?: never
    throwIfInvalid?: never
    graphviz?: never
    watch?: never
    useOverviewGraph?: boolean
  })

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
  projectsOverviewModule,
  singleProjectModule,
  singleProjectReactModule,
  d2Module,
  dotModule,
  mmdModule,
  pumlModule,
  iconsModule,
  rpcModule,
]

export function LikeC4VitePlugin({
  useOverviewGraph = false,
  environments,
  ...opts
}: LikeC4VitePluginOptions): Plugin {
  let logger: ViteLogger
  let likec4: LikeC4LanguageServices
  let assetsDir: string

  let shouldDisposeOnStop = opts.watch ?? false

  return {
    name: 'vite-plugin-likec4',

    applyToEnvironment(env) {
      return environments ? environments.includes(env.name) : true
    },

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
      // Enable RPC via HMR
      const hotChannel = server.hot
      enablePluginRPC.call(this, { logger, likec4, server })

      const readProjects = () =>
        map(likec4.projects(), p => ({
          id: p.id,
          title: p.title,
          folder: p.folder.fsPath,
        }))
      let _projects = readProjects()

      const reloadModule = async (id: string) => {
        const md = server.moduleGraph.getModuleById(id)
        if (md && md.importers.size > 0) {
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
          const [message, ...stack] = error.message.split('\n') as [string, ...string[]]
          hotChannel.send({
            type: 'error',
            err: {
              name: 'LikeC4ValidationError',
              message,
              stack: stack.join('\n'),
              plugin: 'vite-plugin-likec4',
              loc: {
                file: error.sourceFsPath,
                line: error.line,
                column: error.range.start.character + 1,
              },
            },
          })
          return
        }
        const _updated = readProjects()
        if (!isDeepEqual(_updated, _projects)) {
          _projects = _updated
          await reloadModule(projectsModule.virtualId)
          await reloadModule(modelModule.virtualId)
          await reloadModule(projectsOverviewModule.virtualId)
          return
        }

        // Reload modules per project
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

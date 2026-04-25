import { invariant, isNonEmptyArray } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { fromWorkspace } from '@likec4/language-services/node'
import { loggable } from '@likec4/log'
import pDebounce from 'p-debounce'
import { isDeepEqual, map } from 'remeda'
import type {
  Plugin,
  PluginOption,
} from 'vite'
import { iconBundlePlugin } from './icon-bundle-plugin'
import { logger } from './logger'
import { enablePluginRPC } from './rpc'
import { splitErrorMessage } from './rpc/sendError'
import type { ProjectsData } from './virtuals/_shared'
import { type AppConfig, createAppConfigModule } from './virtuals/app-config'
import { d2Module, projectD2Module } from './virtuals/d2'
import { dotModule, projectDotSourcesModule } from './virtuals/dot'
import { drawioModule, projectDrawioModule } from './virtuals/drawio'
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

  /**
   * Configuration for the static application
   */
  appConfig?: AppConfig
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
     * The log level to use.
     * @default 'warning'
     */
    logLevel?: 'trace' | 'debug' | 'info' | 'warning' | 'error' | undefined

    // This option is not allowed when using `workspace`
    languageServices?: never
  } | {
    /**
     * If you have instance of {@link LikeC4LanguageServices}
     * you can pass `languageServices` from it.
     */
    languageServices: LikeC4LanguageServices
    workspace?: never
    printErrors?: never
    throwIfInvalid?: never
    graphviz?: never
    watch?: never
    logLevel?: never
  })

/**
 * Virtual modules per LikeC4 project that should trigger HMR when model changes
 */
const hmrProjectVirtuals = [
  projectModelModule,
  projectIconsModule,
  projectD2Module,
  projectDotSourcesModule,
  projectMmdSourcesModule,
  projectPumlModule,
  projectDrawioModule,
]
/**
 * All virtual modules per LikeC4 project ()
 */
const projectVirtuals = [
  ...hmrProjectVirtuals,
  projectReactModule,
]

const _virtuals = [
  projectsModule,
  modelModule,
  projectsOverviewModule,
  singleProjectModule,
  singleProjectReactModule,
  d2Module,
  dotModule,
  mmdModule,
  pumlModule,
  drawioModule,
  iconsModule,
  rpcModule,
]

const VITE_PLUGIN_LIKEC4 = 'vite-plugin-likec4'

export function LikeC4VitePlugin({
  environments,
  appConfig,
  ...opts
}: LikeC4VitePluginOptions): PluginOption {
  // let logger: ViteLogger
  let likec4: LikeC4LanguageServices
  let assetsDir: string

  let shouldDisposeOnStop = opts.watch ?? false

  const virtuals = [
    ..._virtuals,
    createAppConfigModule(appConfig),
  ]

  const projectsChangeDetector = <T extends ProjectsData>(initialValue: T) => {
    const selectDataToCompare = map((p) => ({
      id: p.id,
      title: p.title,
      folder: p.folder.toString(),
      landingPage: p.config.landingPage,
    })) satisfies (data: T) => any
    let _last = selectDataToCompare(initialValue)
    return (update: T): boolean => {
      const _next = selectDataToCompare(update)
      if (isDeepEqual(_last, _next)) {
        return false
      }
      _last = _next
      return true
    }
  }

  const mainPlugin: Plugin = {
    name: VITE_PLUGIN_LIKEC4,

    applyToEnvironment(env) {
      return environments ? environments.includes(env.name) : true
    },

    async configResolved(config) {
      if (opts.languageServices) {
        likec4 = opts.languageServices
      } else {
        const isDev = config.mode === 'development'
        const watch = shouldDisposeOnStop = opts.watch ?? isDev

        const instance = await fromWorkspace(opts.workspace ?? config.root, {
          graphviz: opts.graphviz ?? 'wasm',
          configureLogger: 'console',
          logLevel: opts.logLevel ?? 'warning',
          printErrors: opts.printErrors ?? true,
          throwIfInvalid: opts.throwIfInvalid ?? false,
          watch,
        })

        likec4 = instance.languageServices
      }
      assetsDir = likec4.workspaceUri.fsPath
    },

    resolveId: {
      filter: {
        id: /^likec4:/,
      },
      handler(id) {
        for (const module of projectVirtuals) {
          const projectId = module.matches(id)
          if (projectId) {
            return {
              id: module.virtualId(projectId),
              external: 'absolute',
              moduleSideEffects: false,
            }
          }
        }
        for (const module of virtuals) {
          if (module.id === id) {
            return {
              id: module.virtualId,
              external: 'absolute',
              moduleSideEffects: false,
            }
          }
        }
        return null
      },
    },

    load: {
      filter: {
        id: /likec4:plugin/,
      },
      async handler(id) {
        for (const module of projectVirtuals) {
          const projectId = module.matches(id)
          if (projectId) {
            const project = likec4.project(projectId)
            return await module.load({
              logger,
              likec4,
              project,
              assetsDir,
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
            })
          }
        }
        return null
      },
    },

    configureServer(server) {
      // Enable RPC via HMR
      const hotChannel = server.hot
      enablePluginRPC.call(this, { logger, likec4, server })

      const isProjectsChange = projectsChangeDetector(likec4.projects())

      const reloadModule = async (id: string) => {
        const md = server.moduleGraph.getModuleById(id)
        if (!md || md.importers.size === 0) {
          return
        }
        try {
          await server.reloadModule(md)
        } catch (err) {
          logger.error(loggable(err))
        }
      }

      likec4.builder.onModelParsed(
        pDebounce(
          async () => {
            const [error] = likec4.getErrors()
            if (error) {
              hotChannel.send({
                type: 'error',
                err: {
                  name: 'LikeC4ValidationError',
                  ...splitErrorMessage(error.message),
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
            const projects = likec4.projects()
            // Update on project data change?
            if (isProjectsChange(projects)) {
              await reloadModule(projectsModule.virtualId)
              await reloadModule(iconsModule.virtualId)
              await reloadModule(modelModule.virtualId)
              if (projects.length > 1) {
                await reloadModule(projectsOverviewModule.virtualId)
              }
              return
            }

            // Reload project-specific Modules
            for (const project of projects) {
              for (const projectModule of hmrProjectVirtuals) {
                await reloadModule(projectModule.virtualId(project.id))
              }
            }
          },
          100,
        ),
      )
    },

    async buildEnd() {
      if (shouldDisposeOnStop) {
        await likec4.dispose()
      }
    },
  } satisfies Plugin

  return [
    iconBundlePlugin({
      environments: environments ? [environments].flat() : undefined,
      workspace: opts.workspace ?? opts.languageServices?.workspacePath,
    }),
    mainPlugin,
  ]
}

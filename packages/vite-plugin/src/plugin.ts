// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core/types'
import type { LikeC4LanguageServices } from '@likec4/language-services'
import { fromWorkspace } from '@likec4/language-services/node'
import { loggable } from '@likec4/log'
import type { AnyTextAdapter } from '@tanstack/ai'
import pDebounce from 'p-debounce'
import { funnel, hasAtLeast, isBoolean, isDeepEqual, map } from 'remeda'
import type {
  Plugin,
  PluginOption,
} from 'vite'
import { detectAI } from './ai/detect-ai'
import { iconBundlePlugin } from './icon-bundle-plugin'
import { logger } from './logger'
import { enablePluginRPC } from './rpc'
import { splitErrorMessage } from './rpc/sendError'
import { type ProjectsData, type SharedVirtualModuleOptions, k } from './virtuals/_shared'
import { type AppConfig, createAppConfigModule } from './virtuals/app-config'
import { d2Module, projectD2Module } from './virtuals/d2'
import { dotModule, projectDotSourcesModule } from './virtuals/dot'
import { drawioModule, projectDrawioModule } from './virtuals/drawio'
import { effectiveWebappExportFormats } from './virtuals/export-formats'
import { iconsModule, projectIconsModule } from './virtuals/icons'
import { mmdModule, projectMmdSourcesModule } from './virtuals/mmd'
import { modelModule, projectModelModule } from './virtuals/model'
import { projectsModule } from './virtuals/projects'
import { projectsOverviewModule } from './virtuals/projectsOverview'
import { projectPumlModule, pumlModule } from './virtuals/puml'
import { projectReactModule, singleProjectReactModule } from './virtuals/react'
import { rpcModule } from './virtuals/rpc'
import { singleProjectModule } from './virtuals/single-project'

export interface AIOptions<TAdapter extends AnyTextAdapter = AnyTextAdapter> {
  /**
   * The AI adapter to use
   *
   * @see https://tanstack.com/ai/latest/docs/getting-started/overview#adapters
   * @example
   * ```ts
   * import { openRouterText } from '@tanstack/ai-openrouter'
   *
   * export default defineConfig({
   *   plugins: [
   *     likec4VitePlugin({
   *       ai: {
   *         adapter: openRouterText("openai/gpt-5")
   *       },
   *     }),
   *   ],
   * })
   * ```
   */
  adapter: TAdapter
  /** Model-specific provider options (type comes from adapter) */
  modelOptions?: TAdapter['~types']['providerOptions']
  maxTokens?: number
}

type SharedOptions = {
  /**
   * AI configuration, by default enabled with automatic detection based on environment variables.
   * You can also provide explicit configuration.
   * Or set to `disabled` to disable AI.
   *
   * @default 'auto' (automatic detection based on environment variables)
   *
   * @see https://tanstack.com/ai/latest/docs/getting-started/overview#adapters
   * @example
   * ```ts
   * import { openRouterText } from '@tanstack/ai-openrouter'
   *
   * export default defineConfig({
   *   plugins: [
   *     likec4VitePlugin({
   *       ai: {
   *         adapter: openRouterText("openai/gpt-5")
   *       },
   *     }),
   *   ],
   * })
   * ```
   */
  ai?: 'disabled' | 'auto' | AIOptions | undefined

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
 * Root virtual modules that cache project-level export capability maps.
 */
const hmrProjectListVirtuals = [
  d2Module,
  dotModule,
  mmdModule,
  pumlModule,
  drawioModule,
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
  ...hmrProjectListVirtuals,
  iconsModule,
  rpcModule,
]

const VITE_PLUGIN_LIKEC4 = 'vite-plugin-likec4'

export function LikeC4VitePlugin({
  environments,
  appConfig,
  ai: _ai = 'auto',
  ...pluginOpts
}: LikeC4VitePluginOptions): PluginOption {
  let likec4: LikeC4LanguageServices
  let assetsDir: string
  let rpcEnabled = false
  let ai: AIOptions | undefined = undefined
  let shouldDisposeOnStop = pluginOpts.watch ?? false

  const virtuals = [
    ..._virtuals,
    createAppConfigModule(appConfig),
  ]

  const initAI = async () => {
    if (isBoolean(_ai)) {
      throw new Error(
        'Invalid AI configuration: true is not allowed, use an object with adapter configuration or false to disable AI',
      )
    }
    if (_ai === 'disabled') {
      return undefined
    }
    if (_ai === 'auto') {
      return await detectAI()
    }
    return _ai
  }

  /**
   * Helper function to merge shared options with module-specific options
   */
  function moduleopts<T>(
    value: Omit<T, keyof SharedVirtualModuleOptions> & Partial<Record<keyof SharedVirtualModuleOptions, never>>,
  ): SharedVirtualModuleOptions & T {
    const isAIAvailable = !!ai
    return {
      rpcEnabled,
      isAIAvailable,
      ai,
      assetsDir,
      likec4,
      logger,
      ...value,
    }
  }

  /**
   * Returns a function that detects changes in the projects data
   * @returns true if the projects data has changed, false otherwise
   */
  const projectsChangeDetector = () => {
    const selectDataToCompare = map((p) => ({
      id: p.id,
      title: p.title,
      folder: p.folder.toString(),
      landingPage: p.config.landingPage,
      exportFormats: effectiveWebappExportFormats(p.config),
    })) satisfies (data: ProjectsData) => any
    let _last: any
    return <T extends ProjectsData>(update: T): boolean => {
      const _next = selectDataToCompare(update)
      // Initialize _last on first call
      _last ??= _next
      if (isDeepEqual(_last, _next)) {
        return false
      }
      _last = _next
      return true
    }
  }

  const mainPlugin: Plugin = {
    name: VITE_PLUGIN_LIKEC4,

    sharedDuringBuild: true,

    applyToEnvironment(env) {
      return environments ? environments.includes(env.name) : true
    },

    async configResolved(config) {
      const isDev = rpcEnabled = config.command === 'serve'

      if (pluginOpts.languageServices) {
        likec4 = pluginOpts.languageServices
      } else {
        const watch = shouldDisposeOnStop = isDev && (pluginOpts.watch ?? true)

        const instance = await fromWorkspace(pluginOpts.workspace ?? config.root, {
          manualLayouts: true,
          graphviz: pluginOpts.graphviz ?? 'wasm',
          configureLogger: 'console',
          logLevel: pluginOpts.logLevel ?? 'warning',
          printErrors: pluginOpts.printErrors ?? true,
          throwIfInvalid: pluginOpts.throwIfInvalid ?? false,
          watch,
        })

        likec4 = instance.languageServices
      }
      assetsDir = likec4.workspaceUri.fsPath

      // Initialize AI only if RPC is enabled
      if (rpcEnabled) {
        ai = await initAI()
      }
    },

    resolveId: {
      filter: {
        id: /^likec4:/,
      },
      handler(id) {
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
            return await module.load.call(
              this,
              moduleopts({ project }),
            )
          }
        }
        for (const module of virtuals) {
          if (module.virtualId === id) {
            const projects = likec4.projects()
            // Early return if no projects
            if (!hasAtLeast(projects, 1)) {
              return null
            }
            return await module.load.call(
              this,
              moduleopts({ projects }),
            )
          }
        }
        return null
      },
    },

    async configureServer(server) {
      if (!rpcEnabled) {
        return
      }
      // Enable RPC via HMR
      enablePluginRPC.call(
        this,
        moduleopts({ server }),
      )

      if (ai) {
        logger.info(
          k.dim('enabling') + ' ' + k.magenta('AI Chat'),
        )
        const { enableAIServer } = await import('./ai/enableServer')
        enableAIServer.call(
          this,
          moduleopts({ server }),
        )
      }
      // Call when server is ready
      return () => {
        const hotChannel = server.hot

        const isProjectsChange = projectsChangeDetector()

        const reloadModule = async (id: string): Promise<boolean> => {
          const md = server.moduleGraph.getModuleById(id)
          if (!md || md.importers.size === 0) {
            return false
          }
          try {
            await server.reloadModule(md)
            return true
          } catch (err) {
            logger.error(loggable(err))
            return false
          }
        }

        const hasErrors = () => {
          const [error] = likec4.getErrors()
          if (!error) {
            return false
          }
          try {
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
            logger.trace(
              k.dim('sent LikeC4ValidationError'),
            )
          } catch (err) {
            logger.error(loggable(err))
          }
          return true
        }

        const reloadProjects = async () => {
          const projects = likec4.projects()
          // Update on project data change?
          if (isProjectsChange(projects)) {
            logger.trace(
              k.dim('onProjectsUpdate - change detected'),
            )
            await reloadModule(projectsModule.virtualId)
            await reloadModule(iconsModule.virtualId)
            await reloadModule(modelModule.virtualId)
            for (const module of hmrProjectListVirtuals) {
              await reloadModule(module.virtualId)
            }
            if (projects.length > 1) {
              await reloadModule(projectsOverviewModule.virtualId)
            }
          } else {
            logger.trace(
              k.dim('onProjectsUpdate - no change'),
            )
          }
        }
        likec4.projectsManager.onProjectsUpdate(
          pDebounce(reloadProjects, 100),
        )

        likec4.builder.onModelParsed(onModelParsedBatched(async (projects) => {
          if (hasErrors()) {
            return
          }
          for (const projectId of projects) {
            logger.trace(
              k.dim('onModelParsed project') + ' ' + k.cyan(projectId),
            )
            for (const projectModule of hmrProjectVirtuals) {
              await reloadModule(projectModule.virtualId(projectId))
            }
          }
        }))
      }
    },

    async buildEnd() {
      if (shouldDisposeOnStop) {
        await likec4.dispose()
      }
    },
  }

  return [
    iconBundlePlugin({
      environments: environments ? [environments].flat() : undefined,
      workspace: pluginOpts.workspace ?? pluginOpts.languageServices?.workspacePath,
    }),
    mainPlugin,
  ]
}

function onModelParsedBatched(
  callback: (projects: ReadonlySet<ProjectId>) => Promise<void>,
): (project: ProjectId) => void {
  return funnel(
    (accumulator: Set<ProjectId>) => {
      callback(accumulator).catch((error) => {
        logger.error(loggable(error))
      })
    },
    {
      reducer: (accumulator, project: ProjectId) => {
        accumulator ??= new Set<ProjectId>()
        accumulator.add(project)
        return accumulator
      },
      triggerAt: 'end',
      minQuietPeriodMs: 130,
      maxBurstDurationMs: 500,
    },
  ).call
}

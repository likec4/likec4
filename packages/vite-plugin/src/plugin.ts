// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core/types'
import type { LikeC4LanguageServices } from '@likec4/language-services'
import type {
  Plugin,
  PluginOption,
} from 'vite'
import type { AIOptions, LikeC4VitePluginOptions } from './types'
import { existsSync } from 'node:fs'
import { fromWorkspace } from '@likec4/language-services/node'
import { loggable } from '@likec4/log'
import { limitFunction } from 'p-limit'
import { resolve } from 'pathe'
import { funnel, isBoolean } from 'remeda'
import { detectAI } from './ai/detect-ai'
import { resolveAppOptions } from './app-options'
import { iconBundlePlugin } from './icon-bundle-plugin'
import { logger } from './logger'
import { enableOpenProjectInEditor } from './openProjectInEditor'
import { reloadModuleInEnvironments } from './reloadModule'
import { enablePluginRPC } from './rpc'
import { splitErrorMessage } from './rpc/sendError'
import {
  type ProjectVirtualModule,
  type SharedVirtualModuleOptions,
  type VirtualModule,
  type VirtualModuleLoadResult,
  indexByName,
  k,
  parseModuleId,
  toVirtualId,
} from './virtuals/_shared'
import { createAppConfigModule } from './virtuals/app-config'
import { customizationModule } from './virtuals/customization'
import { d2Module, projectD2Module } from './virtuals/d2'
import { diffsModule, projectDiffsModule } from './virtuals/diffs'
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
import { projectWebcomponentsModule } from './virtuals/webcomponents'

export type { AIOptions, LikeC4VitePluginOptions }
/**
 * Virtual modules per LikeC4 project, imported as `likec4:<name>/<projectId>`
 */
const projectVirtuals = indexByName<ProjectVirtualModule>([
  projectModelModule,
  projectDiffsModule,
  projectIconsModule,
  projectD2Module,
  projectDotSourcesModule,
  projectMmdSourcesModule,
  projectPumlModule,
  projectDrawioModule,
  projectReactModule,
  projectWebcomponentsModule,
])

/**
 * Global virtual modules, imported as `likec4:<name>`
 */
const globalVirtuals: ReadonlyArray<VirtualModule> = [
  projectsModule,
  modelModule,
  projectsOverviewModule,
  singleProjectModule,
  singleProjectReactModule,
  diffsModule,
  d2Module,
  dotModule,
  mmdModule,
  pumlModule,
  drawioModule,
  iconsModule,
  rpcModule,
  customizationModule,
]

const VITE_PLUGIN_LIKEC4 = 'vite-plugin-likec4'

export function LikeC4VitePlugin({
  environments,
  appConfig,
  title,
  theme,
  useHashHistory,
  webcomponentPrefix,
  customization,
  ai: _ai = 'auto',
  ...pluginOpts
}: LikeC4VitePluginOptions): PluginOption {
  const appOptions = resolveAppOptions({ title, theme, useHashHistory, webcomponentPrefix, customization }, appConfig)

  let likec4: LikeC4LanguageServices
  let assetsDir: string
  let customizationFile: string | undefined
  let rpcEnabled = false
  let ai: AIOptions | undefined = undefined

  const virtuals = indexByName([
    ...globalVirtuals,
    createAppConfigModule(appOptions),
  ])

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
      customizationFile,
      likec4,
      logger,
      ...value,
    }
  }

  const disposables: (() => Promise<void> | void)[] = []
  type Disposable = { dispose: () => void } | (() => void)
  const disposeOnStop = (...disposablesToAdd: Disposable[]) => {
    disposables.push(
      ...disposablesToAdd.map((d) => {
        if ('dispose' in d) {
          return () => d.dispose()
        }
        return () => d()
      }),
    )
  }

  /**
   * Generates code of the virtual module by its resolved id
   */
  async function generate(id: string): Promise<VirtualModuleLoadResult | null> {
    const parsed = parseModuleId(id)
    if (!parsed) {
      return null
    }
    const { name, projectId } = parsed

    // Project scoped virtual modules
    if (projectId) {
      const module = projectVirtuals.get(name)
      if (!module) {
        return null
      }
      return await module.load(moduleopts({ project: likec4.project(projectId) }))
    }

    // Global virtual modules
    const module = virtuals.get(name)
    if (!module) {
      return null
    }
    // Only projects with documents, or the fallback default project if the workspace is empty
    // (modules like `likec4:app-config` must still load)
    const projects = likec4.projects()
    return await module.load(moduleopts({ projects }))
  }

  /**
   * Dev server only: code served to the client, by resolved id.
   * Used to skip HMR updates when the generated code did not change.
   */
  const servedCode = new Map<string, string>()
  /**
   * Dev server only: results generated while checking for changes,
   * served by the next `load` instead of generating again.
   */
  const pendingResults = new Map<string, VirtualModuleLoadResult>()

  const mainPlugin: Plugin = {
    name: VITE_PLUGIN_LIKEC4,

    sharedDuringBuild: true,

    applyToEnvironment(env) {
      return environments ? environments.includes(env.name) : true
    },

    async configResolved(config) {
      const isDev = rpcEnabled = config.command === 'serve'

      if (appOptions.customization) {
        customizationFile = resolve(config.root, appOptions.customization)
        if (!existsSync(customizationFile)) {
          throw new Error(`LikeC4 customization file not found: ${customizationFile}`)
        }
      }

      if (pluginOpts.languageServices) {
        likec4 = pluginOpts.languageServices
      } else {
        let cacheDir = pluginOpts.cacheDir
        if (cacheDir === undefined && config.cacheDir) {
          cacheDir = resolve(config.cacheDir, 'likec4-cache')
        }
        const watch = isDev && (pluginOpts.watch ?? true)

        const instance = await fromWorkspace(pluginOpts.workspace ?? config.root, {
          manualLayouts: true,
          graphviz: pluginOpts.graphviz ?? 'wasm',
          configureLogger: 'console',
          logLevel: pluginOpts.logLevel ?? 'warning',
          printErrors: pluginOpts.printErrors ?? true,
          throwIfInvalid: pluginOpts.throwIfInvalid ?? false,
          watch,
          cacheDir: cacheDir ?? undefined,
        })
        // Dispose only the watching instance (dev server).
        // During a build the plugin is shared between environments (`sharedDuringBuild`),
        // and `buildEnd` runs per environment, so the instance must outlive the first one.
        if (watch) {
          disposeOnStop(instance)
        }

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
        // Resolved ids are matched too, as plugins may inject self-imports (e.g. react-refresh)
        id: /^\0?likec4:/,
      },
      handler(id) {
        const parsed = parseModuleId(id)
        if (!parsed) {
          return
        }
        const { name, projectId } = parsed
        const registry = projectId ? projectVirtuals : virtuals
        if (!registry.has(name)) {
          return
        }
        return {
          id: toVirtualId(name, projectId),
        }
      },
    },

    load: {
      filter: {
        id: /^\0likec4:/,
      },
      async handler(id) {
        let result = pendingResults.get(id)
        if (result) {
          pendingResults.delete(id)
        } else {
          result = await generate(id) ?? undefined
        }
        if (!result) {
          return null
        }
        if (rpcEnabled) {
          servedCode.set(id, codeOf(result))
        }
        return result
      },
    },

    configureServer: {
      async handler(server) {
        if (!rpcEnabled) {
          return
        }
        enableOpenProjectInEditor(server, likec4)
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

          /**
           * Reloads the module in every environment that imports it,
           * but only if its generated code has changed
           */
          const reloadModule = async (id: string): Promise<boolean> => {
            const isImported = Object.values(server.environments).some(env => {
              const md = env.moduleGraph.getModuleById(id)
              return !!md && md.importers.size > 0
            })
            if (!isImported) {
              return false
            }
            try {
              const result = await generate(id)
              if (!result) {
                return false
              }
              if (servedCode.get(id) === codeOf(result)) {
                // drop the result of a change that was reverted before the module was loaded
                pendingResults.delete(id)
                logger.trace(k.dim('unchanged ') + id.slice(1))
                return false
              }
              pendingResults.set(id, result)
              return await reloadModuleInEnvironments(server, id)
            } catch (err) {
              pendingResults.delete(id)
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

          const reloadAllProjects = limitFunction(async () => {
            if (hasErrors()) {
              return
            }
            logger.trace(
              k.dim('onProjectsUpdate - change detected'),
            )
            for (const module of virtuals.values()) {
              if (module.hmr) {
                await reloadModule(toVirtualId(module.name))
              }
            }
          }, { concurrency: 1 })

          const reloadModels = limitFunction(async (projects: ReadonlySet<ProjectId>) => {
            if (hasErrors()) {
              return
            }
            for (const projectId of projects) {
              logger.trace(
                k.dim('onModelParsed project') + ' ' + k.cyan(projectId),
              )
              for (const module of projectVirtuals.values()) {
                if (module.hmr) {
                  await reloadModule(toVirtualId(module.name, projectId))
                }
              }
            }
          }, { concurrency: 1 })

          disposeOnStop(
            () => {
              reloadAllProjects.clearQueue()
              reloadModels.clearQueue()
            },
            likec4.projectsManager.onProjectsUpdate(
              onProjectsUpdateBatched(reloadAllProjects),
            ),
            likec4.builder.onModelParsed(
              onModelParsedBatched(reloadModels),
            ),
          )
        }
      },
    },

    async buildEnd() {
      // splice empties the list, so disposables added while disposing are kept for the next run
      for (const disposable of disposables.splice(0)) {
        try {
          await disposable()
        } catch (error) {
          logger.error(loggable(error))
        }
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

function onProjectsUpdateBatched(
  callback: () => Promise<void>,
): () => void {
  return funnel(
    () => {
      callback().catch((error) => {
        logger.error(loggable(error))
      })
    },
    {
      minGapMs: 300,
      triggerAt: 'both',
    },
  ).call
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
      minQuietPeriodMs: 50,
      maxBurstDurationMs: 300,
    },
  ).call
}

function codeOf(result: VirtualModuleLoadResult): string {
  return typeof result === 'string' ? result : result.code
}

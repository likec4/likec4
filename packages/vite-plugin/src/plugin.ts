import { DefaultMap, invariant, isNonEmptyArray } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { fromWorkspace } from '@likec4/language-services/node'
import { loggable } from '@likec4/log'
import { hasAtLeast, isDeepEqual, map } from 'remeda'
import type {
  Plugin,
  PluginOption,
} from 'vite'
import { logger } from './logger'
import { enablePluginRPC } from './rpc'
import { splitErrorMessage } from './rpc/sendError'
import { k } from './virtuals/_shared'
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
  })

const hmrProjectVirtuals = [
  projectModelModule,
  projectIconsModule,
  projectD2Module,
  projectDotSourcesModule,
  projectMmdSourcesModule,
  projectPumlModule,
  projectDrawioModule,
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
  drawioModule,
  iconsModule,
  rpcModule,
]

const VITE_PLUGIN_LIKEC4 = 'vite-plugin-likec4'

export function LikeC4VitePlugin({
  environments,
  ...opts
}: LikeC4VitePluginOptions): Plugin {
  // let logger: ViteLogger
  let likec4: LikeC4LanguageServices
  let assetsDir: string

  let shouldDisposeOnStop = opts.watch ?? false

  const iconsCache = new DefaultMap(async (key: `${string}:${string}`) => {
    let [group, icon] = key.split(':') as ['aws' | 'azure' | 'gcp' | 'tech', string]
    if (icon.endsWith('.jsx')) {
      icon = icon.slice(0, -4) + '.js'
    }
    const url = `https://icons.like-c4.dev/${group}/${icon}`
    logger.debug(k.dim(`fetching icon: `) + url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch icon: ${response.status} ${response.statusText}`)
    }
    return await response.text()
  })

  return {
    name: VITE_PLUGIN_LIKEC4,

    applyToEnvironment(env) {
      return environments ? environments.includes(env.name) : true
    },

    async configResolved(config) {
      if (opts.languageServices) {
        likec4 = opts.languageServices
      } else {
        const watch = shouldDisposeOnStop = opts.watch ?? config.mode === 'development'
        const instance = await fromWorkspace(opts.workspace ?? config.root, {
          graphviz: opts.graphviz ?? 'wasm',
          configureLogger: 'console',
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
        if (id.includes('likec4:icon-bundle')) {
          return {
            id: `\0${id}`,
            resolvedBy: VITE_PLUGIN_LIKEC4,
          }
        }
        for (const module of projectVirtuals) {
          const projectId = module.matches(id)
          if (projectId) {
            return {
              id: module.virtualId(projectId),
              moduleSideEffects: false,
              resolvedBy: VITE_PLUGIN_LIKEC4,
            }
          }
        }
        for (const module of virtuals) {
          if (module.id === id) {
            return {
              id: module.virtualId,
              resolvedBy: VITE_PLUGIN_LIKEC4,
            }
          }
        }
        return null
      },
    },

    async load(id) {
      if (id.includes('likec4:icon-bundle')) {
        // Take last 2 parts: likec4:iconbundle/projectId/iconPath
        const parts = id.split('/').slice(-2)
        if (!hasAtLeast(parts, 2)) {
          return null
        }
        const [group, icon] = parts
        const code = await iconsCache.get(`${group}:${icon}`)
        return {
          code,
          moduleSideEffects: false,
        }
      }
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

    configureServer(server) {
      // Enable RPC via HMR
      const hotChannel = server.hot
      enablePluginRPC.call(this, { logger, likec4, server })

      const readProjects = () =>
        map(likec4.projects(), p => ({
          id: p.id,
          title: p.title,
          folder: p.folder.toString(),
          landingPage: p.config.landingPage,
        }))
      let _projects = readProjects()

      const reloadModule = async (id: string) => {
        const md = server.moduleGraph.getModuleById(id)
        if (md && md.importers.size > 0) {
          try {
            await server.reloadModule(md)
          } catch (err) {
            logger.error(loggable(err))
          }
        }
      }

      likec4.builder.onModelParsed(async () => {
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
        const _updated = readProjects()
        if (!isDeepEqual(_updated, _projects)) {
          _projects = _updated
          await reloadModule(projectsModule.virtualId)
          await reloadModule(iconsModule.virtualId)
          await reloadModule(modelModule.virtualId)
          if (_projects.length > 1) {
            await reloadModule(projectsOverviewModule.virtualId)
          }
          return
        }

        // Reload modules per project
        for (const project of _updated) {
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
    // transform: {
    //   filter: {
    //     id: /icons\.like-c4/,
    //   },
    //   handler(code, id) {
    //     console.log('icons.likec4', id)
    //     return {
    //       code,
    //     }
    //   },
    // },
  } satisfies PluginOption
}

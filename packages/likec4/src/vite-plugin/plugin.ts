import type { ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import k from 'tinyrainbow'
import type { PluginOption } from 'vite'
import type { ViteLogger } from '../logger'
import { d2Module, projectD2Module } from './virtuals/d2'
import { dotModule, projectDotSourcesModule } from './virtuals/dot'
import { iconsModule, projectIconsModule } from './virtuals/icons'
import { mmdModule, projectMmdSourcesModule } from './virtuals/mmd'
import { modelModule, projectModelModule } from './virtuals/model'
import { projectsModule } from './virtuals/projects'
import { singleProjectModule } from './virtuals/single-project'

export type LikeC4PluginOptions = {
  languageServices: LikeC4LanguageServices
  useOverviewGraph?: boolean
}

const projectVirtuals = [
  projectModelModule,
  projectIconsModule,
  projectD2Module,
  projectDotSourcesModule,
  projectMmdSourcesModule,
  // dotSourcesModule,
  // d2SourcesModule,
  // mmdSourcesModule,
  // overviewGraphModule,
  // previewsModule,
  // likec4ProjectModelModule,
]

const virtuals = [
  projectsModule,
  modelModule,
  singleProjectModule,
  d2Module,
  dotModule,
  mmdModule,
  iconsModule,
]

const isTarget = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

export function likec4({
  useOverviewGraph = false,
  languageServices: likec4,
}: LikeC4PluginOptions): PluginOption {
  let logger: ViteLogger
  let assetsDir = likec4.workspaceUri.fsPath

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
      // const limit = pLimit(1)
      // const triggerHMR = () => {
      //   limit.clearQueue()
      //   void limit(async () => {
      //     const [error] = likec4.getErrors()
      //     if (error) {
      //       server.ws.send({
      //         type: 'error',
      //         err: {
      //           name: 'LikeC4ValidationError',
      //           message: 'Validation error: ' + error.message.slice(0, 500),
      //           stack: '',
      //           plugin: 'vite-plugin-likec4',
      //           loc: {
      //             file: error.sourceFsPath,
      //             line: error.range.start.line + 1,
      //             column: error.range.start.character + 1,
      //           },
      //         },
      //       })
      //       return
      //     }
      //     for (const module of modules) {
      //       const md = server.moduleGraph.getModuleById(module.virtualId)
      //       if (md && md.importers.size > 0) {
      //         logger.info(`${k.green('trigger hmr')} ${k.dim(md.url)}`)
      //         try {
      //           await server.reloadModule(md)
      //         } catch (err) {
      //           logger.error(err)
      //         }
      //       }
      //     }
      //     return
      //   })
      // }

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

      // if (useOverviewGraph && !assetsDir.startsWith(likec4.workspace)) {
      //   logger.info(`${k.dim('watch')} ${assetsDir}`)
      //   const reloadPreviews = () => {
      //     const md = server.moduleGraph.getModuleById(previewsModule.virtualId)
      //     if (md && md.importers.size > 0) {
      //       server.reloadModule(md)
      //     }
      //   }
      //   server.watcher.add(assetsDir)
      //     .on('add', reloadPreviews)
      //     .on('change', reloadPreviews)
      //     .on('unlink', reloadPreviews)
      // }

      // likec4.onModelUpdate(() => {
      //   rootLogger.debug('likec4 model update triggered')
      //   triggerHMR()
      // })
    },
  }
}

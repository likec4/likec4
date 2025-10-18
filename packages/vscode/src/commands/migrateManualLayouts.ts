import { useCommand } from 'reactive-vscode'
import { entries, filter, isTruthy, keys, map, pipe, values } from 'remeda'
import * as vscode from 'vscode'
import { logger, logWarn } from '../logger'
import { commands } from '../meta'
import type { RpcClient } from './types'
export interface OpenPreviewCommandDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
}

export function registerMigrateManualLayoutsCommand({ sendTelemetry, rpc }: OpenPreviewCommandDeps) {
  useCommand(commands.migrateManualLayouts, async () => {
    sendTelemetry(commands.migrateManualLayouts)
    try {
      logger.info(`Migrating manual layouts started`)
      logger.debug('fetching all projects')
      const projects = await rpc.fetchProjects()
      let projectIds = keys(projects)
      logger.info(`Found ${projectIds.length} projects`)

      if (projectIds.length > 1) {
        const items = pipe(
          projects,
          entries(),
          map(([id, p]) => ({
            label: p.config.name,
            description: p.folder,
            selected: true,
            projectId: id,
          })),
        )
        const selected = await vscode.window.showQuickPick(items, {
          canPickMany: true,
          title: 'Select projects to migrate',
        })
        if (!selected || selected.length === 0) {
          logger.info(`No projects selected, cancelling migration`)
          return
        }
        projectIds = selected.map(i => i.projectId)
      }

      for (const project of projectIds) {
        const { model } = await rpc.fetchComputedModel(project).catch(err => {
          logger.warn(`Failed to fetch computed model for project ${project}`, { err })
          return { model: null }
        })
        if (!model) {
          logger.warn`No computed model for project ${project}, skipping`
          continue
        }
        const withManualLayouts = pipe(
          model.views,
          values(),
          filter(v => isTruthy(v.manualLayout)),
        )
        if (withManualLayouts.length === 0) {
          logger.info`No views with manual layouts in project ${project}, skipping`
          continue
        }
        logger.info`Found ${withManualLayouts.length} views with manual layouts in project ${project}`
        for (const v of withManualLayouts) {
          logger.debug`Layout view ${v.id} in project ${project}`
          const layouted = await rpc
            .layoutView({
              projectId: project,
              viewId: v.id,
            })
            .catch(err => {
              logger.warn(`Failed to layout view ${v.id} in project ${project}`, { err })
              return null
            })
          if (!layouted) {
            logger.warn`No layout for view ${v.id} in project ${project}, skipping`
            continue
          }
          logger.info`Migrating view ${v.id} in project ${project}`
          await rpc
            .changeView({
              projectId: project,
              viewId: v.id,
              change: {
                op: 'save-view-snapshot',
                layout: layouted.diagram,
              },
            })
            .catch(err => {
              logger.warn(`Failed to save manual layout for view ${v.id} in project ${project}`, { err })
            })
        }
      }

      logger.info(`Migrating manual layouts completed`)
    } catch (e) {
      logWarn(e)
      return
    }
  })
}

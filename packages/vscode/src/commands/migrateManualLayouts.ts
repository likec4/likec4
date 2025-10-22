import { type ViewId, ProjectId } from '@likec4/core'
import { useCommand } from 'reactive-vscode'
import { filter, isTruthy, keys, map, pipe, values } from 'remeda'
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
    try {
      logger.info(`Migrating manual layouts started`)
      logger.debug('fetching all projects')
      const projects = await rpc.fetchProjects()
      let projectIds = keys(projects)
      logger.info(`Found ${projectIds.length} projects`)

      const projectsWithManualLayouts = new Map<ProjectId, ViewId[]>()

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
          map(v => v.id),
        )
        if (withManualLayouts.length === 0) {
          logger.info`No views with manual layouts in project ${project}, skipping`
          continue
        }
        logger.info`Found ${withManualLayouts.length} views with manual layouts in project ${project}`
        projectsWithManualLayouts.set(project, withManualLayouts)
      }

      if (projectsWithManualLayouts.size === 0) {
        vscode.window.showInformationMessage(`No projects with manual layouts found, nothing to migrate`)
        return
      }
      sendTelemetry(commands.migrateManualLayouts)

      if (projectsWithManualLayouts.size > 1) {
        const items = pipe(
          [...projectsWithManualLayouts.keys()],
          map(id => ({
            label: projects[id]!.config.name,
            description: projects[id]!.folder,
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
        // remove unselected projects
        for (const s of projectsWithManualLayouts.keys()) {
          if (!selected.find(sel => sel.projectId === s)) {
            projectsWithManualLayouts.delete(s)
          }
        }
      }

      for (const [project, withManualLayouts] of projectsWithManualLayouts.entries()) {
        logger.debug`Migrating project ${project} with ${withManualLayouts.length} views`
        for (const vId of withManualLayouts) {
          logger.debug`Layout view ${vId} in project ${project}`
          const layouted = await rpc
            .layoutView({
              projectId: project,
              viewId: vId,
            })
            .catch(err => {
              logger.warn(`Failed to layout view ${vId} in project ${project}`, { err })
              return null
            })
          if (!layouted) {
            logger.warn`No layout for view ${vId} in project ${project}, skipping`
            continue
          }
          logger.info`Migrating view ${vId} in project ${project}`
          await rpc
            .changeView({
              projectId: project,
              viewId: vId,
              change: {
                op: 'save-view-snapshot',
                layout: layouted.diagram,
              },
            })
            .catch(err => {
              logger.warn(`Failed to save manual layout for view ${vId} in project ${project}`, { err })
            })
        }
      }
      vscode.window.showInformationMessage(`Migration completed`)

      logger.info(`Migrating manual layouts completed`)
    } catch (e) {
      logWarn(e)
      return
    }
  })
}

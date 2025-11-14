import type { ProjectId, ViewId } from '@likec4/core'
import { useCommand } from 'reactive-vscode'
import { countBy, keys } from 'remeda'
import * as vscode from 'vscode'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { commands } from '../meta'
import type { PreviewPanel, RpcClient } from './types'

export interface OpenPreviewCommandDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
  preview: PreviewPanel
}

export function registerOpenPreviewCommand({ sendTelemetry, rpc, preview }: OpenPreviewCommandDeps) {
  const { logWarn, logger } = useExtensionLogger()
  useCommand(commands.openPreview, async (viewId?: ViewId, projectId = 'default' as ProjectId) => {
    sendTelemetry(commands.openPreview)
    if (!viewId) {
      try {
        logger.debug('fetching views from all projects')
        const views = await rpc.fetchViewsFromAllProjects()
        if (views.length === 0) {
          await vscode.window.showWarningMessage('No views found', { modal: true })
          return
        }
        const isSingleProject = keys(countBy(views, (v) => v.projectId)).length === 1
        const items = views.map((v) => ({
          label: isSingleProject ? v.id : `${v.projectId}: ${v.id}`,
          description: v.title ?? '',
          viewId: v.id,
          projectId: v.projectId,
        }))
        const selected = await vscode.window.showQuickPick(items, {
          canPickMany: false,
          title: 'Select a view',
        })
        if (!selected) {
          return
        }
        viewId = selected.viewId
        projectId = selected.projectId
      } catch (e) {
        logWarn(e)
        return
      }
    }
    preview.open(viewId, projectId)
  })
}

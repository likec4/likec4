// SPDX-License-Identifier: MIT

import { renderViewPng } from '#copyAsPng'
import type { ProjectId, ViewId } from '@likec4/core'
import { toValue, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { config } from '../config'
import { isVirtual, isWebUi } from '../const'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import {
  defaultPngSaveUri,
  logUsedCli,
  resolveExportTheme,
  resolvePngExportTarget,
  saveDirtyLikeC4Documents,
  showPngExportError,
} from './exportPngShared'
import type { PreviewPanel, RpcClient } from './types'

export interface SaveAsPngCommandDeps {
  sendTelemetry(commandId: string): void
  preview: PreviewPanel
  rpc: RpcClient
}

/**
 * Register "Save as PNG" — used from CodeLens and the command palette.
 * Accepts optional `viewId` / `projectId` (CodeLens); otherwise uses the open preview.
 */
export function registerSaveAsPngCommand({ sendTelemetry, preview, rpc }: SaveAsPngCommandDeps) {
  const { logger, output } = useExtensionLogger()

  useCommand(
    commands.saveAsPng,
    async (viewId?: ViewId, projectId: ProjectId = 'default' as ProjectId) => {
      sendTelemetry(commands.saveAsPng)

      if (isWebUi() || isVirtual()) {
        await vscode.window.showWarningMessage(
          'Save as PNG requires the desktop VS Code extension with a local (file) workspace.',
        )
        return
      }

      const resolvedViewId = viewId ?? toValue(preview.viewId)
      const resolvedProjectId = viewId ? projectId : (toValue(preview.projectId) ?? projectId)
      if (!resolvedViewId || !resolvedProjectId) {
        await vscode.window.showInformationMessage(
          'Open a diagram preview or use the Save PNG CodeLens on a view.',
        )
        return
      }

      const target = await resolvePngExportTarget(rpc, resolvedProjectId)
      if (!target) {
        await vscode.window.showWarningMessage('Open a workspace folder to save the diagram as PNG.')
        return
      }

      const theme = resolveExportTheme()

      try {
        await saveDirtyLikeC4Documents()

        const { workspaceFolder, projectFolder } = target
        const { buffer, cli, cliVersion } = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Exporting “${resolvedViewId}” as PNG…`,
            cancellable: false,
          },
          async () =>
            await renderViewPng({
              workspacePath: workspaceFolder.uri.fsPath,
              projectFolder,
              viewId: resolvedViewId,
              projectId: resolvedProjectId,
              theme,
              nodePath: config.node.path,
              cliPath: config.cli.path,
            }),
        )
        logUsedCli(output, cli, cliVersion)

        const saveUri = await vscode.window.showSaveDialog({
          defaultUri: defaultPngSaveUri(resolvedViewId, workspaceFolder),
          filters: { PNG: ['png'] },
          saveLabel: 'Save PNG',
          title: `Save “${resolvedViewId}” as PNG`,
        })
        if (!saveUri) {
          return
        }

        await vscode.workspace.fs.writeFile(saveUri, buffer)
        await vscode.window.showInformationMessage(`Saved “${resolvedViewId}” as PNG.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error('Save as PNG failed', {
          error,
          viewId: resolvedViewId,
          projectId: resolvedProjectId,
        })
        output.error(`Save as PNG failed for view "${resolvedViewId}": ${message}`)
        output.show(true)
        await showPngExportError('Save as PNG', error)
      }
    },
  )
}

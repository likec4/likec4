// SPDX-License-Identifier: MIT

import { exportCurrentViewAsPng } from '#copyAsPng'
import { toValue, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { config } from '../config'
import { isVirtual, isWebUi } from '../const'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import {
  logUsedCli,
  resolveExportTheme,
  resolvePngExportTarget,
  saveDirtyLikeC4Documents,
  showPngExportError,
} from './exportPngShared'
import type { PreviewPanel, RpcClient } from './types'

export interface CopyAsPngCommandDeps {
  sendTelemetry(commandId: string): void
  preview: PreviewPanel
  rpc: RpcClient
}

/**
 * Register the "Copy as PNG" preview context-menu command.
 * Uses the workspace `likec4 export png` Playwright path, then copies the PNG to the system clipboard.
 */
export function registerCopyAsPngCommand({ sendTelemetry, preview, rpc }: CopyAsPngCommandDeps) {
  const { logger, output } = useExtensionLogger()

  useCommand(commands.previewContextCopyAsPng, async () => {
    sendTelemetry(commands.previewContextCopyAsPng)

    if (isWebUi() || isVirtual()) {
      await vscode.window.showWarningMessage(
        'Copy as PNG requires the desktop VS Code extension with a local (file) workspace.',
      )
      return
    }

    const viewId = toValue(preview.viewId)
    const projectId = toValue(preview.projectId)
    if (!viewId || !projectId) {
      await vscode.window.showInformationMessage('Open a diagram preview to copy it as PNG.')
      return
    }

    const target = await resolvePngExportTarget(rpc, projectId)
    if (!target) {
      await vscode.window.showWarningMessage('Open a workspace folder to copy the diagram as PNG.')
      return
    }

    const theme = resolveExportTheme()

    try {
      // CLI reads on-disk sources; save dirty LikeC4 docs so the PNG matches the preview.
      await saveDirtyLikeC4Documents()

      const { workspaceFolder, projectFolder } = target
      const { cli, cliVersion } = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Copying “${viewId}” as PNG…`,
          cancellable: false,
        },
        async () =>
          await exportCurrentViewAsPng({
            workspacePath: workspaceFolder.uri.fsPath,
            projectFolder,
            viewId,
            projectId,
            theme,
            nodePath: config.node.path,
            cliPath: config.cli.path,
          }),
      )
      logUsedCli(output, cli, cliVersion)
      await vscode.window.showInformationMessage(`Copied “${viewId}” as PNG to the clipboard.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('Copy as PNG failed', { error, viewId, projectId })
      output.error(`Copy as PNG failed for view "${viewId}": ${message}`)
      output.show(true)
      await showPngExportError('Copy as PNG', error)
    }
  })
}

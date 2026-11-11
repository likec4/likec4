// SPDX-License-Identifier: MIT

import { exportCurrentViewAsPng } from '#copyAsPng'
import { toValue, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { isVirtual, isWebUi } from '../const'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import { isLikeC4Source } from '../utils'
import type { PreviewPanel } from './types'

export interface CopyAsPngCommandDeps {
  sendTelemetry(commandId: string): void
  preview: PreviewPanel
}

/**
 * Register the "Copy as PNG" preview context-menu command.
 * Uses the workspace `likec4 export png` Playwright path, then copies the PNG to the system clipboard.
 */
export function registerCopyAsPngCommand({ sendTelemetry, preview }: CopyAsPngCommandDeps) {
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

    const workspaceFolder = resolveWorkspaceFolder()
    if (!workspaceFolder) {
      await vscode.window.showWarningMessage('Open a workspace folder to copy the diagram as PNG.')
      return
    }

    const theme = resolveExportTheme()
    const nodePath = vscode.workspace.getConfiguration('likec4').get<string>('node.path')

    try {
      // CLI reads on-disk sources; save dirty LikeC4 docs so the PNG matches the preview.
      await saveDirtyLikeC4Documents()

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Copying “${viewId}” as PNG…`,
          cancellable: false,
        },
        async () => {
          await exportCurrentViewAsPng({
            workspacePath: workspaceFolder.uri.fsPath,
            viewId,
            projectId,
            theme,
            nodePath,
          })
        },
      )
      await vscode.window.showInformationMessage(`Copied “${viewId}” as PNG to the clipboard.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('Copy as PNG failed', { error, viewId, projectId })
      output.error(`Copy as PNG failed for view "${viewId}": ${message}`)
      output.show(true)
      await vscode.window.showErrorMessage(`Copy as PNG failed: ${message}`)
    }
  })
}

async function saveDirtyLikeC4Documents(): Promise<void> {
  const dirty = vscode.workspace.textDocuments.filter(
    (doc) => doc.isDirty && !doc.isUntitled && isLikeC4Source(doc.fileName),
  )
  await Promise.all(dirty.map((doc) => doc.save()))
}

function resolveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) {
    return undefined
  }
  const active = vscode.window.activeTextEditor?.document.uri
  if (active) {
    return vscode.workspace.getWorkspaceFolder(active) ?? folders[0]
  }
  return folders[0]
}

function resolveExportTheme(): 'light' | 'dark' {
  const kind = vscode.window.activeColorTheme.kind
  switch (kind) {
    case vscode.ColorThemeKind.Dark:
    case vscode.ColorThemeKind.HighContrast:
      return 'dark'
    default:
      return 'light'
  }
}

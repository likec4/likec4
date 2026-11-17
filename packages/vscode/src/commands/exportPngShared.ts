// SPDX-License-Identifier: MIT

import type { ProjectId } from '@likec4/core'
import * as vscode from 'vscode'
import { Likec4CliNotFoundError } from '../likec4CliNotFoundError'
import { version as extensionVersion } from '../meta'
import type { OutputLogger } from '../useExtensionLogger'
import { isLikeC4Source } from '../utils'
import type { RpcClient } from './types'

/**
 * Persist dirty LikeC4 documents so CLI export sees the same model as the preview/editor.
 * @throws If any `TextDocument.save()` resolves to `false`.
 */
export async function saveDirtyLikeC4Documents(): Promise<void> {
  const dirty = vscode.workspace.textDocuments.filter(
    (doc) => doc.isDirty && !doc.isUntitled && isLikeC4Source(doc.fileName),
  )
  const results = await Promise.all(dirty.map(async (doc) => ({
    uri: doc.uri.toString(),
    saved: await doc.save(),
  })))
  const failed = results.filter((result) => !result.saved)
  if (failed.length > 0) {
    throw new Error(
      `Failed to save dirty LikeC4 document(s) before export: ${failed.map((f) => f.uri).join(', ')}`,
    )
  }
}

export function resolveWorkspaceFolder(
  preferredUri?: vscode.Uri,
): vscode.WorkspaceFolder | undefined {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) {
    return undefined
  }
  if (preferredUri) {
    return vscode.workspace.getWorkspaceFolder(preferredUri) ?? folders[0]
  }
  const active = vscode.window.activeTextEditor?.document.uri
  if (active) {
    return vscode.workspace.getWorkspaceFolder(active) ?? folders[0]
  }
  return folders[0]
}

export type PngExportTarget = {
  workspaceFolder: vscode.WorkspaceFolder
  /** Project folder reported by the language server, if available. */
  projectFolder: string | undefined
}

/**
 * Resolve the workspace folder and project folder for a PNG export.
 * The project folder comes from the language server; the workspace folder is the one containing it.
 */
export async function resolvePngExportTarget(
  rpc: RpcClient,
  projectId: ProjectId,
): Promise<PngExportTarget | undefined> {
  let projectUri: vscode.Uri | undefined
  try {
    const projects = await rpc.fetchProjects()
    const folder = projects[projectId]?.folder
    projectUri = folder ? vscode.Uri.parse(folder) : undefined
  } catch {
    // Language server not ready — fall back to the active workspace folder.
    projectUri = undefined
  }
  const workspaceFolder = resolveWorkspaceFolder(projectUri)
  if (!workspaceFolder) {
    return undefined
  }
  return {
    workspaceFolder,
    projectFolder: projectUri?.scheme === 'file' ? projectUri.fsPath : undefined,
  }
}

/**
 * Log which CLI rendered the PNG; warn when its major.minor differs from the extension.
 */
export function logUsedCli(output: OutputLogger, cli: string, cliVersion: string | undefined): void {
  output.info(`PNG export used ${cli}`)
  if (cliVersion && majorMinor(cliVersion) !== majorMinor(extensionVersion)) {
    output.warn(
      `LikeC4 CLI version ${cliVersion} differs from the extension version ${extensionVersion}; `
        + 'the exported PNG may not match the preview.',
    )
  }
}

/**
 * Show a PNG export failure. For a missing CLI, offer to install it or configure `likec4.cli.path`.
 */
export async function showPngExportError(action: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  if (!(error instanceof Likec4CliNotFoundError)) {
    await vscode.window.showErrorMessage(`${action} failed: ${message}`)
    return
  }
  const install = 'Install'
  const configure = 'Configure Path'
  const actions = error.installCommands.length > 0 ? [install, configure] : [configure]
  const picked = await vscode.window.showErrorMessage(`${action} failed: ${message}`, ...actions)
  switch (picked) {
    case install: {
      const terminal = vscode.window.createTerminal({ name: 'LikeC4: install CLI', cwd: error.cwd })
      terminal.show()
      for (const command of error.installCommands) {
        terminal.sendText(command, true)
      }
      return
    }
    case configure:
      await vscode.commands.executeCommand('workbench.action.openSettings', 'likec4.cli.path')
      return
  }
}

function majorMinor(version: string): string {
  return version.split('.').slice(0, 2).join('.')
}

export function resolveExportTheme(): 'light' | 'dark' {
  const kind = vscode.window.activeColorTheme.kind
  switch (kind) {
    case vscode.ColorThemeKind.Dark:
    case vscode.ColorThemeKind.HighContrast:
      return 'dark'
    default:
      return 'light'
  }
}

export function defaultPngSaveUri(viewId: string, workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
  const active = vscode.window.activeTextEditor?.document.uri
  if (active && active.scheme === 'file') {
    return vscode.Uri.joinPath(active, '..', `${viewId}.png`)
  }
  return vscode.Uri.joinPath(workspaceFolder.uri, `${viewId}.png`)
}

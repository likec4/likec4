// SPDX-License-Identifier: MIT

import * as vscode from 'vscode'
import { isLikeC4Source } from '../utils'

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

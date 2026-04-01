import prettyMs from 'pretty-ms'
import * as vscode from 'vscode'

/**
 * High-resolution time (performance.now when available, else Date.now).
 * @returns Time in milliseconds
 */
export function now(): number {
  try {
    return performance.now()
  } catch {
    return Date.now()
  }
}

export type PerformanceMark = {
  readonly ms: number
  readonly pretty: string
}

/**
 * Start a performance mark; returned object has .ms and .pretty for elapsed time.
 * @returns Object with get ms() and get pretty() for elapsed time
 */
export function performanceMark(): PerformanceMark {
  const t0 = now()
  return {
    get ms(): number {
      return now() - t0
    },
    get pretty(): string {
      return prettyMs(now() - t0)
    },
  }
}

/**
 * Check if path is a LikeC4 source file (.c4, .likec4, .like-c4).
 * @param path - File path (case-insensitive)
 * @returns True when extension is LikeC4 source
 */
export function isLikeC4Source(path: string): boolean {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

/**
 * Find a view column for opening source files that avoids the preview panel's column.
 * Prefers an existing visible editor in a different group, otherwise picks a column
 * on the opposite side from the preview.
 */
export function findSourceViewColumn(previewColumn: vscode.ViewColumn | null | undefined): vscode.ViewColumn {
  if (previewColumn != null) {
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.viewColumn != null && editor.viewColumn !== previewColumn) {
        return editor.viewColumn
      }
    }
    return previewColumn === vscode.ViewColumn.One ? vscode.ViewColumn.Two : vscode.ViewColumn.One
  }
  return vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One
}

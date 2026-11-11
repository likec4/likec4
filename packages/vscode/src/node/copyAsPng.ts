// SPDX-License-Identifier: MIT

import { copyPngToClipboard } from './copyPngToClipboard'
import { exportViewPng } from './exportViewPng'

/**
 * Render the current preview view via `likec4 export png` and copy the PNG to the system clipboard.
 */
export async function exportCurrentViewAsPng(params: {
  workspacePath: string
  viewId: string
  projectId: string
  theme: 'light' | 'dark'
  nodePath?: string | undefined
}): Promise<void> {
  const { buffer } = await exportViewPng(params)
  await copyPngToClipboard(buffer)
}

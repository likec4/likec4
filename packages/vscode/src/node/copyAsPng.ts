// SPDX-License-Identifier: MIT

import { copyPngToClipboard } from './copyPngToClipboard'
import { exportViewPng } from './exportViewPng'

export type RenderViewPngParams = {
  workspacePath: string
  viewId: string
  projectId: string
  theme: 'light' | 'dark'
  nodePath?: string | undefined
}

/**
 * Render a view via `likec4 export png` and return the PNG bytes.
 */
export async function renderViewPng(params: RenderViewPngParams): Promise<Buffer> {
  const { buffer } = await exportViewPng(params)
  return buffer
}

/**
 * Render a view via `likec4 export png` and copy the PNG to the system clipboard.
 */
export async function exportCurrentViewAsPng(params: RenderViewPngParams): Promise<void> {
  await copyPngToClipboard(await renderViewPng(params))
}

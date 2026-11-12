// SPDX-License-Identifier: MIT

export type RenderViewPngParams = {
  workspacePath: string
  viewId: string
  projectId: string
  theme: 'light' | 'dark'
  nodePath?: string | undefined
}

/**
 * Browser/web extension stub: Playwright PNG export is desktop-only.
 */
export async function renderViewPng(_params: RenderViewPngParams): Promise<Buffer> {
  throw new Error('PNG export is not available in the web extension.')
}

/**
 * Browser/web extension stub: Playwright PNG export is desktop-only.
 */
export async function exportCurrentViewAsPng(_params: RenderViewPngParams): Promise<void> {
  throw new Error('Copy as PNG is not available in the web extension.')
}

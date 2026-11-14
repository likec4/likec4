// SPDX-License-Identifier: MIT

export type RenderViewPngParams = {
  workspacePath: string
  projectFolder?: string | undefined
  viewId: string
  projectId: string
  theme: 'light' | 'dark'
  nodePath?: string | undefined
  cliPath?: string | undefined
}

export type RenderViewPngResult = {
  buffer: Buffer
  cli: string
  cliVersion?: string | undefined
}

/**
 * Browser/web extension stub: Playwright PNG export is desktop-only.
 */
export async function renderViewPng(_params: RenderViewPngParams): Promise<RenderViewPngResult> {
  throw new Error('PNG export is not available in the web extension.')
}

/**
 * Browser/web extension stub: Playwright PNG export is desktop-only.
 */
export async function exportCurrentViewAsPng(_params: RenderViewPngParams): Promise<RenderViewPngResult> {
  throw new Error('Copy as PNG is not available in the web extension.')
}

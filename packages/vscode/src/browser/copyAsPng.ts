// SPDX-License-Identifier: MIT

/**
 * Browser/web extension stub: Playwright PNG export is desktop-only.
 */
export async function exportCurrentViewAsPng(_params: {
  workspacePath: string
  viewId: string
  projectId: string
  theme: 'light' | 'dark'
  nodePath?: string | undefined
}): Promise<void> {
  throw new Error('Copy as PNG is not available in the web extension.')
}

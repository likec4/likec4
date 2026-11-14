// SPDX-License-Identifier: MIT

import { copyPngToClipboard } from './copyPngToClipboard'
import { type ExportViewPngParams, exportViewPng } from './exportViewPng'

export type RenderViewPngParams = Omit<ExportViewPngParams, 'extraArgs'>

export type RenderViewPngResult = {
  buffer: Buffer
  /** Description of the CLI that rendered the PNG, for logs. */
  cli: string
  cliVersion?: string | undefined
}

/**
 * Render a view via `likec4 export png` and return the PNG bytes.
 * @throws {Likec4CliNotFoundError} When the CLI cannot be resolved.
 */
export async function renderViewPng(params: RenderViewPngParams): Promise<RenderViewPngResult> {
  const { buffer, cli, cliVersion } = await exportViewPng(params)
  return { buffer, cli, cliVersion }
}

/**
 * Render a view via `likec4 export png` and copy the PNG to the system clipboard.
 * @throws {Likec4CliNotFoundError} When the CLI cannot be resolved.
 */
export async function exportCurrentViewAsPng(params: RenderViewPngParams): Promise<RenderViewPngResult> {
  const result = await renderViewPng(params)
  await copyPngToClipboard(result.buffer)
  return result
}

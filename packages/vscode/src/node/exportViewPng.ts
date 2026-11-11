// SPDX-License-Identifier: MIT

import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { resolveLikec4Cli, resolveNodeBinary } from './resolveLikec4Cli'

const execFileAsync = promisify(execFile)

export type ExportViewPngParams = {
  workspacePath: string
  viewId: string
  projectId: string
  theme: 'light' | 'dark'
  nodePath?: string | undefined
  /** Extra CLI args (tests / advanced). */
  extraArgs?: string[] | undefined
}

export type ExportViewPngResult = {
  buffer: Buffer
  /** Absolute path of the PNG that was read (temp file, may already be deleted). */
  pngPath: string
}

/**
 * Render a single view to a PNG buffer via the same Playwright path as `likec4 export png`.
 */
export async function exportViewPng(params: ExportViewPngParams): Promise<ExportViewPngResult> {
  const cli = await resolveLikec4Cli(params.workspacePath)
  if (!cli) {
    throw new Error(
      'LikeC4 CLI not found in this workspace. Install the `likec4` package (and Playwright Chromium) to use Copy as PNG.',
    )
  }

  const outdir = await mkdtemp(join(tmpdir(), 'likec4-copy-png-'))
  const exportArgs = [
    'export',
    'png',
    '--flat',
    '--outdir',
    outdir,
    '--filter',
    params.viewId,
    '--project',
    params.projectId,
    '--theme',
    params.theme,
    ...(params.extraArgs ?? []),
    params.workspacePath,
  ]

  try {
    try {
      if (cli.kind === 'mjs') {
        const nodeBinary = resolveNodeBinary(params.nodePath)
        await execFileAsync(nodeBinary, [cli.entry, ...exportArgs], execOptions(params.workspacePath))
      } else {
        await execFileAsync(cli.bin, exportArgs, execOptions(params.workspacePath))
      }
    } catch (error) {
      throw new Error(formatExecError(error, 'likec4 export png failed'))
    }

    const pngPath = await findExportedPng(outdir, params.viewId)
    if (!pngPath) {
      throw new Error(`Export finished but no PNG was found for view "${params.viewId}".`)
    }
    const buffer = await readFile(pngPath)
    return { buffer, pngPath }
  } finally {
    await rm(outdir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Locate the exported PNG for a view id under an export output directory
 * (CLI may nest under a project folder when the workspace has multiple projects).
 */
export async function findExportedPng(outdir: string, viewId: string): Promise<string | null> {
  const expectedName = `${viewId}.png`
  const stack = [outdir]
  while (stack.length > 0) {
    const dir = stack.pop()!
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      if (entry.isFile() && entry.name === expectedName) {
        return full
      }
    }
  }
  return null
}

function execOptions(cwd: string) {
  return {
    cwd,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      // Avoid interactive prompts from ensure-libs when deps are missing.
      CI: process.env['CI'] ?? '1',
    },
  }
}

function formatExecError(error: unknown, prefix: string): string {
  if (!error || typeof error !== 'object') {
    return `${prefix}: ${String(error)}`
  }
  const err = error as {
    message?: string
    stderr?: string | Buffer
    stdout?: string | Buffer
  }
  const stderr = bufferToTrimmedString(err.stderr)
  const stdout = bufferToTrimmedString(err.stdout)
  const detail = stderr || stdout || err.message || String(error)
  return `${prefix}: ${detail}`
}

function bufferToTrimmedString(value: string | Buffer | undefined): string {
  if (!value) {
    return ''
  }
  return (typeof value === 'string' ? value : value.toString('utf8')).trim()
}

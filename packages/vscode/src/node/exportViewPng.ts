// SPDX-License-Identifier: MIT

import spawn, { SubprocessError } from 'nano-spawn'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Likec4CliNotFoundError } from '../likec4CliNotFoundError'
import {
  type ResolvedLikec4Cli,
  describeLikec4Cli,
  resolveInstallCommands,
  resolveLikec4Cli,
  resolveNodeBinary,
} from './resolveLikec4Cli'

export type ExportViewPngParams = {
  workspacePath: string
  /** Folder of the exported LikeC4 project; the CLI is resolved from here first. */
  projectFolder?: string | undefined
  viewId: string
  projectId: string
  theme: 'light' | 'dark'
  /** `likec4.node.path` */
  nodePath?: string | undefined
  /** `likec4.cli.path` */
  cliPath?: string | undefined
  /** Extra CLI args (tests / advanced). */
  extraArgs?: string[] | undefined
}

export type ExportViewPngResult = {
  buffer: Buffer
  /** Absolute path of the PNG that was read (temp file, may already be deleted). */
  pngPath: string
  /** Description of the CLI that rendered the PNG, for logs. */
  cli: string
  /** CLI version, when resolved from the `likec4` package. */
  cliVersion?: string | undefined
}

/**
 * Render a single view to a PNG buffer via the same Playwright path as `likec4 export png`.
 * @throws {Likec4CliNotFoundError} When the CLI cannot be resolved.
 */
export async function exportViewPng(params: ExportViewPngParams): Promise<ExportViewPngResult> {
  const searchFrom = params.projectFolder && params.projectFolder !== params.workspacePath
    ? [params.projectFolder, params.workspacePath]
    : [params.workspacePath]
  const cli = await resolveLikec4Cli({
    configuredPath: params.cliPath,
    workspacePath: params.workspacePath,
    searchFrom,
  })
  if (!cli) {
    const cwd = searchFrom[0] ?? params.workspacePath
    throw new Likec4CliNotFoundError(cwd, await resolveInstallCommands(cwd))
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
      await runCli(cli, exportArgs, params)
    } catch (error) {
      throw new Error(formatSpawnError(error, 'likec4 export png failed'))
    }

    const pngPath = await findExportedPng(outdir, params.viewId)
    if (!pngPath) {
      throw new Error(`Export finished but no PNG was found for view "${params.viewId}".`)
    }
    const buffer = await readFile(pngPath)
    return {
      buffer,
      pngPath,
      cli: describeLikec4Cli(cli),
      cliVersion: cli.kind === 'node' ? cli.version : undefined,
    }
  } finally {
    await rm(outdir, { recursive: true, force: true }).catch(() => {})
  }
}

async function runCli(cli: ResolvedLikec4Cli, exportArgs: string[], params: ExportViewPngParams) {
  const options = {
    cwd: params.workspacePath,
    timeout: EXPORT_PROCESS_TIMEOUT_MS,
    env: {
      // Avoid interactive prompts from ensure-libs when deps are missing.
      CI: process.env['CI'] ?? '1',
    },
  }
  switch (cli.kind) {
    case 'node':
      return await spawn(resolveNodeBinary(params.nodePath), [cli.entry, ...exportArgs], options)
    case 'command':
      // nano-spawn escapes args and uses a shell for Windows .cmd shims (yarn, global likec4).
      return await spawn(cli.command, [...cli.args, ...exportArgs], {
        ...options,
        cwd: cli.cwd ?? options.cwd,
      })
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

/** Overall budget for Vite + Playwright export of a single view (ms). */
const EXPORT_PROCESS_TIMEOUT_MS = 180_000

function formatSpawnError(error: unknown, prefix: string): string {
  if (!(error instanceof SubprocessError)) {
    return `${prefix}: ${error instanceof Error ? error.message : String(error)}`
  }
  if (error.signalName === 'SIGTERM' && error.durationMs >= EXPORT_PROCESS_TIMEOUT_MS) {
    return `${prefix}: timed out after ${EXPORT_PROCESS_TIMEOUT_MS / 1000}s`
  }
  const detail = error.stderr.trim() || error.stdout.trim() || error.message
  return `${prefix}: ${detail}`
}

// SPDX-License-Identifier: MIT

import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type ResolvedLikec4Cli =
  | {
    kind: 'mjs'
    /** Absolute path to `likec4/bin/likec4.mjs`. */
    entry: string
  }
  | {
    kind: 'bin'
    /** Absolute path to a `node_modules/.bin/likec4` shim (or PATH binary). */
    bin: string
  }

/**
 * Resolve the workspace `likec4` CLI by walking up from the workspace root.
 * Reuses the same Playwright-based `export png` packaging users already install for the CLI.
 */
export async function resolveLikec4Cli(workspacePath: string): Promise<ResolvedLikec4Cli | null> {
  let dir = workspacePath
  for (;;) {
    const mjsEntry = join(dir, 'node_modules', 'likec4', 'bin', 'likec4.mjs')
    if (await isReadableFile(mjsEntry)) {
      return { kind: 'mjs', entry: mjsEntry }
    }

    const binShim = join(dir, 'node_modules', '.bin', 'likec4')
    if (await isReadableFile(binShim)) {
      return { kind: 'bin', bin: binShim }
    }

    // Windows npm/pnpm shims
    const binCmd = join(dir, 'node_modules', '.bin', 'likec4.cmd')
    if (await isReadableFile(binCmd)) {
      return { kind: 'bin', bin: binCmd }
    }

    const parent = dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }

  const fromPath = await resolveFromPath()
  if (fromPath) {
    return { kind: 'bin', bin: fromPath }
  }
  return null
}

/**
 * Resolve the Node binary used to run the LikeC4 CLI (honours `likec4.node.path` when provided).
 */
export function resolveNodeBinary(configuredPath: string | undefined): string {
  const trimmed = configuredPath?.trim()
  if (trimmed) {
    return trimmed
  }
  return 'node'
}

async function resolveFromPath(): Promise<string | null> {
  try {
    const command = process.platform === 'win32' ? 'where' : 'which'
    const { stdout } = await execFileAsync(command, ['likec4'])
    const first = stdout.split(/\r?\n/).map(line => line.trim()).find(Boolean)
    return first || null
  } catch {
    return null
  }
}

async function isReadableFile(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

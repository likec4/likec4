// SPDX-License-Identifier: MIT

import { access, readFile, realpath } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { resolveCommand } from 'package-manager-detector/commands'
import { detect } from 'package-manager-detector/detect'

export type ResolvedLikec4Cli =
  | {
    /** Run a JS entry with Node: `<node> <entry> ...args`. */
    kind: 'node'
    /** Absolute path to the CLI entry (e.g. `likec4/bin/likec4.mjs`). */
    entry: string
    /** Version from the resolved `likec4/package.json`, when known. */
    version?: string | undefined
    source: 'setting' | 'package'
  }
  | {
    /** Run an executable: `<command> ...args ...exportArgs`. */
    kind: 'command'
    command: string
    args: string[]
    /** Working directory override (Yarn PnP runs from the PnP root). */
    cwd?: string | undefined
    source: 'setting' | 'yarn-pnp'
  }

export type ResolveLikec4CliParams = {
  /** Value of `likec4.cli.path`; relative paths resolve against `workspacePath`. */
  configuredPath?: string | undefined
  /** Workspace folder of the exported project. */
  workspacePath: string
  /** Folders to resolve the `likec4` package from, highest priority first (project folder, then workspace). */
  searchFrom: readonly string[]
}

/**
 * Resolve the `likec4` CLI used for PNG export.
 *
 * Order:
 * 1. `likec4.cli.path` setting (explicit wins; a missing file is an error, not a fallback).
 * 2. The `likec4` package visible from each `searchFrom` folder, via the Node `node_modules`
 *    lookup hierarchy (handles hoisting and workspaces). `NODE_PATH` and global folders are ignored:
 *    package managers inject them into child processes, which would pick up an unrelated install.
 * 3. Yarn PnP (`.pnp.cjs` above the project): `yarn likec4`.
 *
 * Returns `null` when nothing is found. Global installs on PATH are intentionally ignored:
 * their version is unknown — point `likec4.cli.path` at them explicitly.
 */
export async function resolveLikec4Cli(params: ResolveLikec4CliParams): Promise<ResolvedLikec4Cli | null> {
  const configured = params.configuredPath?.trim()
  if (configured) {
    return await fromConfiguredPath(configured, params.workspacePath)
  }

  for (const dir of params.searchFrom) {
    const resolved = await fromPackage(dir)
    if (resolved) {
      return resolved
    }
  }

  for (const dir of params.searchFrom) {
    const pnpRoot = await findUp(dir, '.pnp.cjs')
    if (pnpRoot) {
      return { kind: 'command', command: 'yarn', args: ['likec4'], cwd: pnpRoot, source: 'yarn-pnp' }
    }
  }

  return null
}

/**
 * Commands that install the CLI (and Playwright Chromium) with the package manager detected in `cwd`.
 * Falls back to npm when no package manager is detected.
 */
export async function resolveInstallCommands(cwd: string): Promise<string[]> {
  const pm = await detect({ cwd }).catch(() => null)
  const agent = pm?.agent ?? 'npm'
  const add = resolveCommand(agent, 'add', ['-D', 'likec4', 'playwright'])
  const chromium = resolveCommand(agent, 'execute-local', ['playwright', 'install', 'chromium'])
  return [add, chromium]
    .filter((cmd) => cmd !== null)
    .map(({ command, args }) => [command, ...args].join(' '))
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

/** Human-readable description of the resolved CLI, for logs. */
export function describeLikec4Cli(cli: ResolvedLikec4Cli): string {
  switch (cli.kind) {
    case 'node':
      return `likec4${cli.version ? ` ${cli.version}` : ''} (${cli.entry}, from ${cli.source})`
    case 'command':
      return `${[cli.command, ...cli.args].join(' ')} (from ${cli.source})`
  }
}

async function fromConfiguredPath(configured: string, workspacePath: string): Promise<ResolvedLikec4Cli> {
  const path = isAbsolute(configured) ? configured : resolve(workspacePath, configured)
  if (!(await isReadableFile(path))) {
    throw new Error(`\`likec4.cli.path\` points to a missing file: ${path}`)
  }
  if (/\.[cm]?js$/i.test(path)) {
    return { kind: 'node', entry: path, source: 'setting' }
  }
  return { kind: 'command', command: path, args: [], source: 'setting' }
}

async function fromPackage(dir: string): Promise<ResolvedLikec4Cli | null> {
  const packageDir = await findUp(dir, join('node_modules', 'likec4', 'package.json'))
  if (!packageDir) {
    return null
  }
  // Follow pnpm symlinks so the CLI runs from its real location.
  const packageJsonPath = await realpath(join(packageDir, 'node_modules', 'likec4', 'package.json'))
  try {
    const pkg: unknown = JSON.parse(await readFile(packageJsonPath, 'utf8'))
    const bin = readBinEntry(pkg)
    if (!bin) {
      return null
    }
    const entry = resolve(dirname(packageJsonPath), bin)
    if (!(await isReadableFile(entry))) {
      return null
    }
    return { kind: 'node', entry, version: readVersion(pkg), source: 'package' }
  } catch {
    return null
  }
}

function readBinEntry(pkg: unknown): string | null {
  if (!pkg || typeof pkg !== 'object' || !('bin' in pkg)) {
    return null
  }
  const { bin } = pkg
  switch (true) {
    case typeof bin === 'string':
      return bin
    case !!bin && typeof bin === 'object' && 'likec4' in bin && typeof bin.likec4 === 'string':
      return bin.likec4
    default:
      return null
  }
}

function readVersion(pkg: unknown): string | undefined {
  if (pkg && typeof pkg === 'object' && 'version' in pkg && typeof pkg.version === 'string') {
    return pkg.version
  }
  return undefined
}

/** Nearest ancestor of `from` (inclusive) that contains `relativePath`. */
async function findUp(from: string, relativePath: string): Promise<string | null> {
  let dir = from
  for (;;) {
    if (await isReadableFile(join(dir, relativePath))) {
      return dir
    }
    const parent = dirname(dir)
    if (parent === dir) {
      return null
    }
    dir = parent
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

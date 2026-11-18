// SPDX-License-Identifier: MIT

import { mkdir, mkdtemp, realpath, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveInstallCommands, resolveLikec4Cli, resolveNodeBinary } from './resolveLikec4Cli'

async function tempDir(prefix: string): Promise<string> {
  // realpath: macOS tmpdir is a symlink, and Node resolution returns real paths.
  return await realpath(await mkdtemp(join(tmpdir(), prefix)))
}

async function installFakeLikec4(root: string, pkg: Record<string, unknown> = {}): Promise<string> {
  const pkgDir = join(root, 'node_modules', 'likec4')
  await mkdir(join(pkgDir, 'bin'), { recursive: true })
  await writeFile(
    join(pkgDir, 'package.json'),
    JSON.stringify({
      name: 'likec4',
      version: '1.60.0',
      bin: './bin/likec4.mjs',
      exports: { './package.json': './package.json' },
      ...pkg,
    }),
  )
  const entry = join(pkgDir, 'bin', 'likec4.mjs')
  await writeFile(entry, '#!/usr/bin/env node\n')
  return entry
}

describe('resolveLikec4Cli', () => {
  it('resolves the likec4 package from a nested project folder (hoisted install)', async () => {
    const root = await tempDir('likec4-cli-hoisted-')
    const project = join(root, 'apps', 'demo')
    await mkdir(project, { recursive: true })
    const entry = await installFakeLikec4(root)

    await expect(resolveLikec4Cli({ workspacePath: root, searchFrom: [project, root] })).resolves.toEqual({
      kind: 'node',
      entry,
      version: '1.60.0',
      source: 'package',
    })
  })

  it('prefers the install in the project folder over the workspace root', async () => {
    const root = await tempDir('likec4-cli-project-')
    const project = join(root, 'packages', 'arch')
    await mkdir(project, { recursive: true })
    await installFakeLikec4(root, { version: '1.0.0' })
    const projectEntry = await installFakeLikec4(project, { version: '1.60.0' })

    const resolved = await resolveLikec4Cli({ workspacePath: root, searchFrom: [project, root] })
    expect(resolved).toMatchObject({ kind: 'node', entry: projectEntry, version: '1.60.0' })
  })

  it('reads the bin entry from a bin map', async () => {
    const root = await tempDir('likec4-cli-binmap-')
    const entry = await installFakeLikec4(root, { bin: { likec4: './bin/likec4.mjs' } })

    await expect(resolveLikec4Cli({ workspacePath: root, searchFrom: [root] })).resolves.toMatchObject({
      kind: 'node',
      entry,
    })
  })

  it('uses `yarn likec4` under Yarn PnP', async () => {
    const root = await tempDir('likec4-cli-pnp-')
    const project = join(root, 'docs')
    await mkdir(project, { recursive: true })
    await writeFile(join(root, '.pnp.cjs'), '')

    await expect(resolveLikec4Cli({ workspacePath: root, searchFrom: [project] })).resolves.toEqual({
      kind: 'command',
      command: 'yarn',
      args: ['likec4'],
      cwd: root,
      source: 'yarn-pnp',
    })
  })

  it('returns null when the CLI is not installed', async () => {
    const root = await tempDir('likec4-cli-missing-')
    await expect(resolveLikec4Cli({ workspacePath: root, searchFrom: [root] })).resolves.toBeNull()
  })

  describe('likec4.cli.path', () => {
    it('wins over the installed package and runs .mjs with node', async () => {
      const root = await tempDir('likec4-cli-setting-')
      await installFakeLikec4(root)
      const custom = join(root, 'custom.mjs')
      await writeFile(custom, '')

      await expect(
        resolveLikec4Cli({ configuredPath: 'custom.mjs', workspacePath: root, searchFrom: [root] }),
      ).resolves.toEqual({ kind: 'node', entry: custom, source: 'setting' })
    })

    it('runs other files as executables', async () => {
      const root = await tempDir('likec4-cli-setting-bin-')
      const bin = join(root, 'likec4')
      await writeFile(bin, '')

      await expect(
        resolveLikec4Cli({ configuredPath: ` ${bin} `, workspacePath: root, searchFrom: [root] }),
      ).resolves.toEqual({ kind: 'command', command: bin, args: [], source: 'setting' })
    })

    it('fails instead of falling back when the file is missing', async () => {
      const root = await tempDir('likec4-cli-setting-missing-')
      await installFakeLikec4(root)

      await expect(
        resolveLikec4Cli({ configuredPath: 'nope.mjs', workspacePath: root, searchFrom: [root] }),
      ).rejects.toThrow('`likec4.cli.path` points to a missing file')
    })
  })
})

describe('resolveInstallCommands', () => {
  it('uses the package manager detected from the lockfile', async () => {
    const root = await tempDir('likec4-cli-install-pnpm-')
    await writeFile(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n')

    await expect(resolveInstallCommands(root)).resolves.toEqual([
      'pnpm add -D likec4 playwright',
      'pnpm exec playwright install chromium',
    ])
  })

  it('reads the packageManager field from package.json', async () => {
    const root = await tempDir('likec4-cli-install-bun-')
    await writeFile(join(root, 'package.json'), JSON.stringify({ packageManager: 'bun@1.2.0' }))

    await expect(resolveInstallCommands(root)).resolves.toEqual([
      'bun add -D likec4 playwright',
      'bun x playwright install chromium',
    ])
  })
})

describe('resolveNodeBinary', () => {
  it('prefers the configured path when set', () => {
    expect(resolveNodeBinary(' /custom/node ')).toBe('/custom/node')
  })

  it('falls back to node when unset', () => {
    expect(resolveNodeBinary(undefined)).toBe('node')
    expect(resolveNodeBinary('')).toBe('node')
    expect(resolveNodeBinary('   ')).toBe('node')
  })
})

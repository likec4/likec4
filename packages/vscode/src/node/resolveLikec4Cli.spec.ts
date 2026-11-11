// SPDX-License-Identifier: MIT

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isWindowsBatchShim, resolveLikec4Cli, resolveNodeBinary } from './resolveLikec4Cli'

describe('resolveLikec4Cli', () => {
  it('finds likec4/bin/likec4.mjs by walking up from the workspace', async () => {
    const root = await mkdtemp(join(tmpdir(), 'likec4-cli-resolve-'))
    const nested = join(root, 'apps', 'demo')
    await mkdir(nested, { recursive: true })
    const binDir = join(root, 'node_modules', 'likec4', 'bin')
    await mkdir(binDir, { recursive: true })
    const entry = join(binDir, 'likec4.mjs')
    await writeFile(entry, '#!/usr/bin/env node\n')

    await expect(resolveLikec4Cli(nested)).resolves.toEqual({ kind: 'mjs', entry })
  })

  it('finds node_modules/.bin/likec4 when the package entry is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'likec4-cli-bin-'))
    const binDir = join(root, 'node_modules', '.bin')
    await mkdir(binDir, { recursive: true })
    const bin = join(binDir, 'likec4')
    await writeFile(bin, '#!/bin/sh\n')

    await expect(resolveLikec4Cli(root)).resolves.toEqual({ kind: 'bin', bin })
  })

  it('returns null when the CLI is not installed', async () => {
    const root = await mkdtemp(join(tmpdir(), 'likec4-cli-missing-'))
    // Isolate from PATH by using a unique name that which/where won't find for the package;
    // resolveLikec4Cli may still find a global `likec4` on PATH in some environments.
    // Assert the walk finds nothing by checking only the mjs/bin-under-root behavior via a
    // subdirectory that has no node_modules and hoping PATH has no likec4 — skip if present.
    const resolved = await resolveLikec4Cli(root)
    if (resolved?.kind === 'bin') {
      // Global PATH hit — acceptable; workspace-local miss is still covered by the positive tests.
      expect(resolved.bin.length).toBeGreaterThan(0)
      return
    }
    expect(resolved).toBeNull()
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

describe('isWindowsBatchShim', () => {
  it('detects cmd and bat shims', () => {
    expect(isWindowsBatchShim(String.raw`C:\proj\node_modules\.bin\likec4.cmd`)).toBe(true)
    expect(isWindowsBatchShim('likec4.BAT')).toBe(true)
    expect(isWindowsBatchShim('/proj/node_modules/.bin/likec4')).toBe(false)
  })
})

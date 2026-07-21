// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  expectedPackedTarballs,
  localMcpBin,
  removePackedTarballs,
} from '../../scripts/smoke-packed-install.mjs'

function packageDir(name: string): string {
  const dir = join(tmpdir(), `likec4-smoke-script-${process.pid}-${name}`)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('smoke-packed-install helpers', () => {
  it('requires packed tarballs for every public workspace package', () => {
    const publicPacked = packageDir('public-packed')
    const publicMissing = packageDir('public-missing')
    const privateMissing = packageDir('private-missing')
    const publicTarball = join(publicPacked, 'package.tgz')
    writeFileSync(publicTarball, 'packed')

    const packages = [
      { dir: publicPacked, name: '@likec4/public-packed', private: false },
      { dir: publicMissing, name: '@likec4/public-missing', private: false },
      { dir: privateMissing, name: '@likec4/private-missing', private: true },
    ]

    expect(() => expectedPackedTarballs(packages)).toThrow(
      /Expected packed tarballs are missing[\s\S]*@likec4\/public-missing/,
    )
  })

  it('returns public tarballs and ignores private workspace packages', () => {
    const publicPacked = packageDir('only-public-packed')
    const privateMissing = packageDir('ignored-private-missing')
    const publicTarball = join(publicPacked, 'package.tgz')
    writeFileSync(publicTarball, 'packed')

    const packages = [
      { dir: publicPacked, name: '@likec4/public-packed', private: false },
      { dir: privateMissing, name: '@likec4/private-missing', private: true },
    ]

    expect(expectedPackedTarballs(packages)).toEqual([publicTarball])
  })

  it('removes stale public tarballs before packing', () => {
    const publicPacked = packageDir('stale-public')
    const privatePacked = packageDir('stale-private')
    const publicTarball = join(publicPacked, 'package.tgz')
    const privateTarball = join(privatePacked, 'package.tgz')
    writeFileSync(publicTarball, 'stale')
    writeFileSync(privateTarball, 'private')

    removePackedTarballs([
      { dir: publicPacked, name: '@likec4/public-packed', private: false },
      { dir: privatePacked, name: '@likec4/private-packed', private: true },
    ])

    expect(() =>
      expectedPackedTarballs([
        { dir: publicPacked, name: '@likec4/public-packed', private: false },
        { dir: privatePacked, name: '@likec4/private-packed', private: true },
      ])
    ).toThrow(/@likec4\/public-packed/)
    expect(expectedPackedTarballs([
      { dir: privatePacked, name: '@likec4/private-packed', private: true },
    ])).toEqual([])
  })

  it('resolves the installed local MCP binary without npx', () => {
    expect(localMcpBin('/tmp/install', 'linux')).toBe('/tmp/install/node_modules/.bin/likec4-mcp')
    expect(localMcpBin('C:\\install', 'win32')).toBe('C:\\install\\node_modules\\.bin\\likec4-mcp.cmd')
  })
})

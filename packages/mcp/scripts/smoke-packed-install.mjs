#!/usr/bin/env node

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const packageDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repoRoot = resolve(packageDir, '../..')
const runOnWindowsShell = process.platform === 'win32'

function run(command, args, options = {}) {
  const cwd = options.cwd ?? repoRoot
  console.log(`$ ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      CI: 'true',
    },
    encoding: 'utf8',
    shell: runOnWindowsShell,
    stdio: options.capture ? 'pipe' : 'inherit',
  })

  if (options.capture) {
    return result
  }

  if (result.status !== 0) {
    throw new Error(`Command failed with exit ${result.status ?? result.signal}: ${command} ${args.join(' ')}`)
  }
  return result
}

function workspacePackageDirs() {
  const result = run('pnpm', ['--filter', '@likec4/mcp...', 'list', '--depth', '-1', '--json'], { capture: true })
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
    throw new Error(`Unable to list MCP workspace package closure: ${result.status ?? result.signal}`)
  }

  const packageInfos = JSON.parse(result.stdout ?? '[]')
  if (!Array.isArray(packageInfos)) {
    throw new Error('Unexpected pnpm workspace package list output')
  }

  return packageInfos.flatMap(packageInfo => {
    return typeof packageInfo.path === 'string' ? [packageInfo.path] : []
  })
}

function packageTarballs(packageDirs) {
  return packageDirs
    .map(packageDir => join(packageDir, 'package.tgz'))
    .filter(existsSync)
}

const tempRoot = mkdtempSync(join(tmpdir(), 'likec4-mcp-pack-smoke-'))
const installDir = join(tempRoot, 'install')
const installLog = join(tempRoot, 'npm-install.log')

mkdirSync(installDir)

console.log(`Smoke workspace: ${tempRoot}`)
const packageDirs = workspacePackageDirs()
run('pnpm', ['turbo', 'run', 'pack', '--filter=@likec4/mcp...'])

const tarballs = packageTarballs(packageDirs)
const mcpTarball = join(packageDir, 'package.tgz')

if (!existsSync(mcpTarball)) {
  throw new Error(`Expected MCP tarball was not created: ${mcpTarball}`)
}
if (!tarballs.includes(mcpTarball)) {
  tarballs.push(mcpTarball)
}

writeFileSync(
  join(installDir, 'package.json'),
  `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
)

const install = run('npm', ['install', ...tarballs], { cwd: installDir, capture: true })
writeFileSync(installLog, `${install.stdout ?? ''}${install.stderr ?? ''}`)

if (install.status !== 0) {
  console.error(`npm install failed. Log: ${installLog}`)
  process.stdout.write(install.stdout ?? '')
  process.stderr.write(install.stderr ?? '')
  throw new Error(`npm install failed with exit ${install.status ?? install.signal}`)
}

run('npx', ['likec4-mcp', '--help'], { cwd: installDir })
console.log(`MCP packed install smoke passed. Tarball: ${mcpTarball}`)

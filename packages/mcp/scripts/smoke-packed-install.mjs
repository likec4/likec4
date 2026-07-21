#!/usr/bin/env node

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repoRoot = resolve(packageDir, '../..')
const runOnWindowsShell = process.platform === 'win32'

/**
 * @typedef {object} WorkspacePackage
 * @property {string} dir
 * @property {string} name
 * @property {boolean} private
 */

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

/** @returns {Array<WorkspacePackage>} */
export function workspacePackages() {
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
    if (typeof packageInfo.path !== 'string') {
      return []
    }
    const manifest = JSON.parse(readFileSync(join(packageInfo.path, 'package.json'), 'utf8'))
    return [{
      dir: packageInfo.path,
      name: typeof manifest.name === 'string' ? manifest.name : packageInfo.path,
      private: manifest.private === true,
    }]
  })
}

function tarballPath(workspacePackage) {
  return join(workspacePackage.dir, 'package.tgz')
}

export function removePackedTarballs(packages) {
  for (const workspacePackage of packages) {
    if (!workspacePackage.private) {
      rmSync(tarballPath(workspacePackage), { force: true })
    }
  }
}

export function expectedPackedTarballs(packages) {
  const missing = []
  const tarballs = []

  for (const workspacePackage of packages) {
    if (workspacePackage.private) {
      continue
    }
    const tarball = tarballPath(workspacePackage)
    if (existsSync(tarball)) {
      tarballs.push(tarball)
    } else {
      missing.push(`${workspacePackage.name}: ${tarball}`)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Expected packed tarballs are missing:\n${missing.map(item => `- ${item}`).join('\n')}`)
  }

  return tarballs
}

export function localMcpBin(installDir, platform = process.platform) {
  return join(installDir, 'node_modules', '.bin', platform === 'win32' ? 'likec4-mcp.cmd' : 'likec4-mcp')
}

export function main() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'likec4-mcp-pack-smoke-'))
  const installDir = join(tempRoot, 'install')
  const installLog = join(tempRoot, 'npm-install.log')

  try {
    mkdirSync(installDir)

    console.log(`Smoke workspace: ${tempRoot}`)
    const packages = workspacePackages()
    removePackedTarballs(packages)
    run('pnpm', ['turbo', 'run', 'pack', '--filter=@likec4/mcp...'])

    const tarballs = expectedPackedTarballs(packages)
    const mcpTarball = join(packageDir, 'package.tgz')

    if (!tarballs.includes(mcpTarball)) {
      throw new Error(`Expected MCP tarball was not created: ${mcpTarball}`)
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

    const mcpBin = localMcpBin(installDir)
    if (!existsSync(mcpBin)) {
      throw new Error(`Expected local MCP binary was not installed: ${mcpBin}`)
    }
    run(mcpBin, ['--help'], { cwd: installDir })
    console.log(`MCP packed install smoke passed. Tarball: ${mcpTarball}`)
    rmSync(tempRoot, { recursive: true, force: true })
  } catch (error) {
    console.error(`Smoke workspace preserved for debugging: ${tempRoot}`)
    throw error
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main()
}

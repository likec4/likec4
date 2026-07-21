// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { readdirSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const srcDir = new URL('..', import.meta.url)
const packageDir = fileURLToPath(new URL('../..', import.meta.url))

function sourceFiles(dir: URL): Array<URL> {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '__tests__') {
      return []
    }
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir)
    if (entry.isDirectory()) {
      return sourceFiles(url)
    }
    return entry.name.endsWith('.ts') ? [url] : []
  })
}

describe('@likec4/mcp package manifest', () => {
  it('declares runtime imports as dependencies for npx installs', ({ expect }) => {
    const runtimeImports = [
      '@hono/mcp',
      '@hono/node-server',
      '@likec4/config',
      '@likec4/core',
      '@likec4/language-server',
      '@likec4/language-services',
      '@likec4/layouts',
      '@likec4/log',
      '@modelcontextprotocol/sdk',
      'citty',
      'defu',
      'hono',
      'remeda',
      'tinyrainbow',
      'unctx',
      'vscode-uri',
      'zod',
    ]

    expect(packageJson.dependencies).toEqual(
      expect.objectContaining(
        Object.fromEntries(runtimeImports.map(dep => [dep, expect.any(String)])),
      ),
    )
    expect(Object.keys(packageJson.devDependencies ?? {})).not.toEqual(
      expect.arrayContaining(runtimeImports),
    )
  })

  it('uses resolvable ESM subpaths for runtime MCP SDK imports', () => {
    const extensionlessRuntimeImports = sourceFiles(srcDir).flatMap(file => {
      const source = readFileSync(file, 'utf8')
      return source.split('\n')
        .map(line => line.match(/^\s*import\s+(?!type\b).*?\sfrom\s+['"](@modelcontextprotocol\/sdk\/[^'"]+)['"]/))
        .map(match => match?.[1])
        .filter((specifier): specifier is string => !!specifier && !specifier.endsWith('.js'))
        .map(specifier => `${relative(packageDir, fileURLToPath(file))} imports ${specifier}`)
    })

    expect(extensionlessRuntimeImports).toEqual([])
  })
})

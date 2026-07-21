// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { readdirSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'

type RuntimeImport = {
  file: string
  packageName: string
  specifier: string
}

const packageDir = fileURLToPath(new URL('../..', import.meta.url))
const srcDir = fileURLToPath(new URL('..', import.meta.url))

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map(moduleName => `node:${moduleName}`),
])

function isRuntimeSourceFile(fileName: string): boolean {
  return fileName.endsWith('.ts')
    && !fileName.endsWith('.d.ts')
    && !fileName.endsWith('.spec.ts')
    && !fileName.endsWith('.test.ts')
    && !fileName.endsWith('.int.spec.ts')
}

function sourceFiles(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '__tests__') {
      return []
    }
    const child = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      return sourceFiles(child)
    }
    return isRuntimeSourceFile(entry.name) ? [child] : []
  })
}

function packageNameFromSpecifier(specifier: string): string | null {
  if (
    specifier.startsWith('.')
    || specifier.startsWith('/')
    || specifier.startsWith('#')
    || specifier.startsWith('node:')
    || nodeBuiltins.has(specifier)
  ) {
    return null
  }
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0] ?? null
}

function hasRuntimeImport(importClause: ts.ImportClause | undefined): boolean {
  if (!importClause) {
    return true
  }
  if (importClause.isTypeOnly) {
    return false
  }
  if (importClause.name) {
    return true
  }
  const namedBindings = importClause.namedBindings
  if (!namedBindings) {
    return false
  }
  if (ts.isNamespaceImport(namedBindings)) {
    return true
  }
  if (namedBindings.elements.length === 0) {
    return true
  }
  return namedBindings.elements.some(element => !element.isTypeOnly)
}

function hasRuntimeExport(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) {
    return false
  }
  if (!node.exportClause) {
    return true
  }
  if (!ts.isNamedExports(node.exportClause)) {
    return true
  }
  if (node.exportClause.elements.length === 0) {
    return true
  }
  return node.exportClause.elements.some(element => !element.isTypeOnly)
}

function runtimeImport(filePath: string, specifier: string): RuntimeImport | null {
  const packageName = packageNameFromSpecifier(specifier)
  if (!packageName) {
    return null
  }
  return {
    file: relative(packageDir, filePath),
    packageName,
    specifier,
  }
}

function collectRuntimeImportsFromSource(sourceText: string, filePath: string): Array<RuntimeImport> {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports: Array<RuntimeImport> = []

  function addSpecifier(specifier: string) {
    const importInfo = runtimeImport(filePath, specifier)
    if (importInfo) {
      imports.push(importInfo)
    }
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (hasRuntimeImport(node.importClause)) {
        addSpecifier(node.moduleSpecifier.text)
      }
    }
    if (
      ts.isExportDeclaration(node) && hasRuntimeExport(node) && node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      addSpecifier(node.moduleSpecifier.text)
    }
    if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length === 1
    ) {
      const specifier = node.arguments[0]
      if (specifier && ts.isStringLiteral(specifier)) {
        addSpecifier(specifier.text)
      }
    }
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'require'
      && node.arguments.length === 1
    ) {
      const specifier = node.arguments[0]
      if (specifier && ts.isStringLiteral(specifier)) {
        addSpecifier(specifier.text)
      }
    }
    if (
      ts.isImportEqualsDeclaration(node)
      && ts.isExternalModuleReference(node.moduleReference)
      && ts.isStringLiteral(node.moduleReference.expression)
    ) {
      addSpecifier(node.moduleReference.expression.text)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return imports
}

function collectRuntimeImportsFromFile(filePath: string): Array<RuntimeImport> {
  return collectRuntimeImportsFromSource(readFileSync(filePath, 'utf8'), filePath)
}

function uniqueRuntimeImports(): Array<RuntimeImport> {
  const seen = new Set<string>()
  return sourceFiles(srcDir)
    .flatMap(collectRuntimeImportsFromFile)
    .filter(importInfo => {
      const key = `${importInfo.file}:${importInfo.specifier}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

describe('@likec4/mcp runtime package imports', () => {
  it('extracts only runtime package imports from TypeScript source', () => {
    const imports = collectRuntimeImportsFromSource(
      [
        'import type { TypeOnly } from \'type-only-package\'',
        'import { value, type ValueType } from \'@scope/runtime/value\'',
        'import defaultValue from \'default-runtime\'',
        'import * as namespaceValue from \'namespace-runtime\'',
        'import {} from \'empty-runtime\'',
        'import \'side-effect-runtime\'',
        'import { readFileSync } from \'node:fs\'',
        'import { local } from \'./local\'',
        'import internalValue from \'#internal/runtime\'',
        'export { runtimeExport } from \'export-runtime\'',
        'export { runtimeExport, type ExportType } from \'mixed-export-runtime\'',
        'export { type ExportType } from \'export-type-only\'',
        'export type { ExportType } from \'export-type-only-declaration\'',
        'const required = require(\'required-runtime\')',
        'import equalsRuntime = require(\'equals-runtime\')',
        'async function load() { return import(\'dynamic-runtime\') }',
      ].join('\n'),
      `${packageDir}/synthetic.ts`,
    )

    expect(imports.map(({ packageName, specifier }) => [packageName, specifier])).toEqual([
      ['@scope/runtime', '@scope/runtime/value'],
      ['default-runtime', 'default-runtime'],
      ['namespace-runtime', 'namespace-runtime'],
      ['empty-runtime', 'empty-runtime'],
      ['side-effect-runtime', 'side-effect-runtime'],
      ['export-runtime', 'export-runtime'],
      ['mixed-export-runtime', 'mixed-export-runtime'],
      ['required-runtime', 'required-runtime'],
      ['equals-runtime', 'equals-runtime'],
      ['dynamic-runtime', 'dynamic-runtime'],
    ])
  })

  it('declares direct runtime package imports as dependencies', () => {
    const dependencies = new Set(Object.keys(packageJson.dependencies ?? {}))
    const devDependencies = new Set(Object.keys(packageJson.devDependencies ?? {}))

    const runtimeImports = uniqueRuntimeImports()

    const missingDependencies = runtimeImports
      .filter(({ packageName }) => !dependencies.has(packageName))
      .map(({ file, packageName, specifier }) => `${file} imports ${specifier} from ${packageName}`)

    const misplacedDependencies = runtimeImports
      .filter(({ packageName }) => devDependencies.has(packageName))
      .map(({ file, packageName, specifier }) => `${file} imports ${specifier} from ${packageName}`)

    expect(missingDependencies).toEqual([])
    expect(misplacedDependencies).toEqual([])
  })

  it('uses Node-resolvable runtime MCP SDK subpaths', () => {
    const unresolved = uniqueRuntimeImports()
      .filter(({ specifier }) => specifier.startsWith('@modelcontextprotocol/sdk/'))
      .flatMap(({ file, specifier }) => {
        try {
          import.meta.resolve(specifier)
          return []
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          return [`${file} imports ${specifier}: ${message}`]
        }
      })

    expect(unresolved).toEqual([])
  })
})

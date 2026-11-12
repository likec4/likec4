#!/usr/bin/env node
/**
 * Ensures @likec4/spa, @likec4/react and likec4 share the same React-bundle
 * runtime dependencies (same keys and catalog/version specs).
 *
 * - spa.dependencies must equal react.dependencies
 * - every react.dependency must appear on likec4.dependencies with the same spec
 *
 * likec4 may declare additional dependencies for the CLI/toolchain.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readPkg(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'))
}

export function checkReactBundleDeps({
  spaPath = 'packages/likec4-spa/package.json',
  reactPath = 'packages/react/package.json',
  likec4Path = 'packages/likec4/package.json',
  readPackage = readPkg,
} = {}) {
  const spa = readPackage(spaPath)
  const react = readPackage(reactPath)
  const likec4 = readPackage(likec4Path)

  const spaDeps = spa.dependencies ?? {}
  const reactDeps = react.dependencies ?? {}
  const likec4Deps = likec4.dependencies ?? {}

  const spaKeys = Object.keys(spaDeps).sort()
  const reactKeys = Object.keys(reactDeps).sort()

  assert.deepEqual(
    spaKeys,
    reactKeys,
    `@likec4/spa and @likec4/react must declare the same dependency keys.\n` +
      `spa-only: ${spaKeys.filter(k => !(k in reactDeps)).join(', ') || '(none)'}\n` +
      `react-only: ${reactKeys.filter(k => !(k in spaDeps)).join(', ') || '(none)'}`,
  )

  for (const key of reactKeys) {
    assert.equal(
      spaDeps[key],
      reactDeps[key],
      `@likec4/spa and @likec4/react disagree on "${key}": spa=${spaDeps[key]} react=${reactDeps[key]}`,
    )
    assert.ok(
      key in likec4Deps,
      `likec4.dependencies is missing shared React-bundle dep "${key}" (from @likec4/react)`,
    )
    assert.equal(
      likec4Deps[key],
      reactDeps[key],
      `likec4 and @likec4/react disagree on "${key}": likec4=${likec4Deps[key]} react=${reactDeps[key]}`,
    )
  }

  return { shared: reactKeys }
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  try {
    const { shared } = checkReactBundleDeps()
    console.log(
      `OK: ${shared.length} shared React-bundle dependencies aligned across spa, react, likec4`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

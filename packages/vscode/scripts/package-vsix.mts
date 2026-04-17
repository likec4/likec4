import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { $, cd } from 'zx'

$.verbose = true

/**
 * vsce tool does not work with pnpm
 * so we need to prepare package.json for NPM
 *
 * Resolve actual dependency versions from pnpm-lock.yaml, scoped to
 * the packages/vscode importer. This is deterministic and avoids
 * pnpm CLI quirks where `pnpm ls -P` misses hoisted deps.
 */

const packageJson = JSON.parse(await readFile('package.json', 'utf-8'))
const declaredDeps = packageJson.dependencies as Record<string, string> ?? {}

// Parse the lockfile to get exact resolved versions for this package.
// The lockfile section for packages/vscode lists each dependency with
// its specifier and resolved version (e.g., "version: 5.1.0(esbuild@0.27.4)").
const lockfilePath = resolve('../../pnpm-lock.yaml')
const lockfile = await readFile(lockfilePath, 'utf-8')

// Extract the packages/vscode dependencies section from the lockfile.
// Format: "  packages/vscode:\n    dependencies:\n      <name>:\n        specifier: ...\n        version: <ver>"
const vscodeSectionMatch = lockfile.match(/^ {2}packages\/vscode:\n([\s\S]*?)(?=\n {2}packages\/)/m)
if (!vscodeSectionMatch) {
  throw new Error('Could not find packages/vscode section in pnpm-lock.yaml')
}
const vscodeSection = vscodeSectionMatch[1]

// Extract the dependencies block (before devDependencies)
const depsBlockMatch = vscodeSection.match(/^ {4}dependencies:\n([\s\S]*?)(?=\n {4}devDependencies:)/m)
if (!depsBlockMatch) {
  throw new Error('Could not find dependencies block for packages/vscode in lockfile')
}
const depsBlock = depsBlockMatch[1]

// Parse each dependency's version from the lockfile
const resolvedDeps: Record<string, string> = {}
for (const name of Object.keys(declaredDeps)) {
  // Match: "      <name>:\n        specifier: ...\n        version: <version>"
  const versionMatch = depsBlock.match(new RegExp(`^ {6}${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\n {8}specifier:.*\\n {8}version: (.+)`, 'm'))
  if (!versionMatch) {
    throw new Error(
      `Failed to resolve version for production dependency "${name}" in pnpm-lock.yaml. `
        + `The VSIX would ship without it.`,
    )
  }
  // Strip pnpm version suffixes like "5.1.0(esbuild@0.27.4)" → "5.1.0"
  const version = versionMatch[1].split('(')[0].trim()

  if (name === 'esbuild') {
    // Replace esbuild with esbuild-wasm for cross-platform compatibility
    resolvedDeps[name] = `npm:esbuild-wasm@${version}`
  } else {
    resolvedDeps[name] = version
  }
  console.log(`  ${name}: ${resolvedDeps[name]}`)
}

packageJson.dependencies = resolvedDeps
packageJson.devDependencies = {}

const outdir = await mkdtemp(join(tmpdir(), 'likec4-extension'))
console.log(outdir)

await cp('.', outdir, {
  recursive: true,
  filter: source => !source.includes('node_modules'),
})

const cwd = process.cwd()

cd(outdir)
await writeFile('package.json', JSON.stringify(packageJson, null, 2))
await $`npm install --production`
await $`npx @vscode/vsce package --out likec4.vsix`

const outvsix = join(cwd, 'likec4.vsix')
await cp('likec4.vsix', outvsix)

console.log(` 📦 VSIX file created: ${outvsix}`)

await rm(outdir, { recursive: true }).catch(() => {})

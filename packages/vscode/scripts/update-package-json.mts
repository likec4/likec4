import { readFile, writeFile } from 'node:fs/promises'
import { $ } from 'zx'

/**
 * vsce tool does not work with pnpm
 * so we need to prepare package.json for NPM
 */

const [{ dependencies }] = await $`pnpm ls -P --json`.json<[{
  dependencies: Record<string, {
    from: string
    version: string
    resolved: string
    path: string
  }>
}]>()

const packageJson = JSON.parse(await readFile('package.json', 'utf-8'))
packageJson.dependencies = Object.fromEntries(
  Object.entries(dependencies)
    .map(([name, { version }]) => {
      if (name === 'esbuild') {
        return [name, `npm:esbuild-wasm@${version}`]
      }
      return [name, version]
    }),
)
packageJson.devDependencies = {}
await writeFile('package.json', JSON.stringify(packageJson, null, 2))

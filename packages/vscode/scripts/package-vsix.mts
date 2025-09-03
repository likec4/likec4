import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isCI } from 'std-env'
import { $, cd } from 'zx'

$.verbose = true

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

const outdir = await mkdtemp(join(tmpdir(), 'likec4-extension'))
console.log(outdir)

await cp('.', outdir, {
  recursive: true,
  filter: source => !source.includes('node_modules'),
})

const cwd = process.cwd()

await cd(outdir)
await writeFile('package.json', JSON.stringify(packageJson, null, 2))
await $`npm install`
await $`npx vsce package --out likec4.vsix`

const outvsix = join(cwd, 'likec4.vsix')
await cp('likec4.vsix', outvsix)

console.log(`${isCI ? '::info::' : ' '}📦 VSIX file created: ${outvsix}`)

await rm(outdir, { recursive: true }).catch(() => {})

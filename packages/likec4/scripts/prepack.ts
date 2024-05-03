import { $ } from 'execa'
import { existsSync } from 'node:fs'
import { cp, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const $$ = $({
  stderr: 'inherit',
  stdout: 'inherit',
  env: {
    NODE_ENV: 'production'
  }
})

console.log('Run build\n')

// Run build
await $$`yarn build:turbo`

console.log('\nUpdate package.json\n')

// Copy dependencies from core and diagrams

let pkgJson
if (!existsSync('package.json.backup')) {
  await cp('package.json', 'package.json.backup')
  pkgJson = JSON.parse(await readFile('package.json', 'utf-8'))
  console.log('Created package.json backup')
} else {
  // Read from backup
  pkgJson = JSON.parse(await readFile('package.json.backup', 'utf-8'))
  console.log('Read from package.json.backup')
}

const corePkg = JSON.parse(await readFile(resolve('../core/package.json'), 'utf-8'))
const diagramPkg = JSON.parse(await readFile(resolve('../diagram/package.json'), 'utf-8'))

pkgJson.dependencies = {
  ...corePkg.dependencies,
  ...diagramPkg.dependencies,
  ...pkgJson.dependencies
}

delete pkgJson.dependencies['@likec4/core']
delete pkgJson.dependencies['@likec4/diagram']
delete pkgJson.dependencies['@likec4/diagrams']

await writeFile('package.json', JSON.stringify(pkgJson, null, 2))

console.log('package.json updated')

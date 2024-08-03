import consola from 'consola'
import { $ } from 'execa'
import { rimraf } from 'rimraf'

consola.info('Generating routes...')
await $`tsr generate`

// Copy icons
await $`mkdir -p icons`
const copyDirs = [
  '../icons/aws',
  '../icons/gcp',
  '../icons/tech'
]
await $`cp -r ${copyDirs} icons`

await rimraf('icons/*/*.{tsx,ts}', { glob: true })
await rimraf('icons/*/index.js', { glob: true })

const copyFiles = [
  '../icons/icon.d.ts',
  '../icons/all.d.ts',
  '../icons/all.js'
]
await $`cp ${copyFiles} icons/`

consola.success('Copied icons')

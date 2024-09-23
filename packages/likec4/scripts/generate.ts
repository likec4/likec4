import consola from 'consola'
import { $ } from 'execa'
import { fdir } from 'fdir'
import { rmSync } from 'node:fs'

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

// Clean up icons .tsx files
const files = new fdir({
  includeDirs: false,
  includeBasePath: true,
  filters: [(name, isDir) => {
    return !isDir && (name.endsWith('/index.js') || !name.endsWith('.js'))
  }]
}).crawl('icons').sync()

for (const file of files) {
  rmSync(file)
}

const copyFiles = [
  '../icons/icon.d.ts',
  '../icons/all.d.ts',
  '../icons/all.js'
]
await $`cp ${copyFiles} icons/`

consola.success('Copied icons')

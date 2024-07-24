import consola from 'consola'
import { $ } from 'execa'
import { rimraf } from 'rimraf'

consola.info('Generating routes...')
await $`tsr generate`

// Copy icons
await $`mkdir -p icons`
await $`cp -r ../icons/aws icons`
await $`cp -r ../icons/gcp icons`
await $`cp -r ../icons/tech icons`

await rimraf('icons/*/*.d.ts', { glob: true })
await rimraf('icons/*/index.js', { glob: true })
await rimraf('icons/*/*.jsx', { glob: true })

await $`cp ../icons/icon.d.ts icons/`

consola.success('Copied icons')

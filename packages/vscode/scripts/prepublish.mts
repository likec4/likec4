import consola from 'consola'
import { $ as $_ } from 'execa'
import { rm } from 'node:fs/promises'

const $ = $_({
  stderr: 'inherit',
  stdout: 'inherit',
  env: {
    NODE_ENV: 'production'
  }
})

consola.info('clean dist')
await rm('dist/', { recursive: true, force: true })

// Run build
await $`yarn build:turbo`

import consola from 'consola'
import { $ as $_ } from 'execa'
import { resolve } from 'node:path'
import { emptyDir } from './_utils'

const $ = $_({
  stdout: process.stdout,
  stderr: process.stderr,
  env: {
    NODE_ENV: 'production'
  }
})

consola.start('Building...')

emptyDir(resolve('react'))
emptyDir(resolve('dist'))

// Run build
await $`yarn turbo-build`

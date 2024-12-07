import consola from 'consola'
import { $ } from 'execa'
import { resolve } from 'node:path'
import { emptyDir } from './_utils'

import { isProduction } from 'std-env'

if (!isProduction) {
  consola.error('prepack script must be run in production mode')
  process.exit(1)
}

emptyDir(resolve('react'))
emptyDir(resolve('__app__'))
emptyDir(resolve('dist'))

consola.start('Building...')

// Run build
await $({
  stdout: process.stdout,
  stderr: process.stderr
})`yarn turbo-build`

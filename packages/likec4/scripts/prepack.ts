import consola from 'consola'
import { $ } from 'execa'
import { existsSync } from 'node:fs'
import { cp, rm } from 'node:fs/promises'

const $$ = $({
  stderr: 'inherit',
  stdout: 'inherit',
  env: {
    NODE_ENV: 'production'
  }
})

consola.info('clean dist')
await rm('dist/', { recursive: true, force: true })

consola.start('Building...')

// Run build
await $$`yarn build:turbo`

// Run build
await $$`yarn tsc -p app/tsconfig.react.json`

const components = 'dist/__app__/react/components.mjs'
if (!existsSync(components)) {
  throw new Error('Components not found')
}
await cp(components, 'react/index.mjs')
await rm(components)

consola.success('React bundle moved to react/index.mjs')

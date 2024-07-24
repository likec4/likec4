import consola from 'consola'
import { $ as $_ } from 'execa'
import { existsSync } from 'node:fs'
import { cp } from 'node:fs/promises'

const $ = $_({
  stderr: 'inherit',
  stdout: 'inherit',
  env: {
    NODE_ENV: 'production'
  }
})

consola.start('Building...')

// Run build
await $`yarn turbo-build`

// Build type definitions
await $`yarn tsc -p ./app/react/tsconfig-build.json`

const components = 'dist/__app__/react/components.mjs'
if (!existsSync(components)) {
  throw new Error('Components not found')
}
await cp(components, 'react/index.mjs')

consola.success('React bundle copied to react/index.mjs')

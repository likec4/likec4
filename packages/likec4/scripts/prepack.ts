import consola from 'consola'
import { $ as $_ } from 'execa'
import { existsSync } from 'node:fs'
import { cp, rm } from 'node:fs/promises'

const $ = $_({
  stderr: 'inherit',
  stdout: 'inherit',
  env: {
    NODE_ENV: 'production'
  }
})

await rm('dist/', { recursive: true, force: true })

consola.start('Building...')

// Run build
await $`yarn turbo-build`

// Build type definitions
await $`yarn tsc -p ./app/react/tsconfig-build.json `

const components = 'dist/__app__/react/components.mjs'
if (!existsSync(components)) {
  throw new Error('Components not found')
}
await cp(components, 'react/index.mjs')
await rm(components)

consola.success('React bundle moved to react/index.mjs')

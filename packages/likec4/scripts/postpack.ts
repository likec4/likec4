import consola from 'consola'
import { $ } from 'execa'
import { existsSync } from 'node:fs'
import { cp } from 'node:fs/promises'

if (!existsSync('react/index.mjs')) {
  throw new Error('react/index.mjs not found')
}
await $`cp react/index.mjs dist/__app__/react/components.mjs`

consola.success('React bundle returned to dist/__app__/react/components.mjs')

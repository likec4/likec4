import consola from 'consola'
import { existsSync } from 'node:fs'
import { cp, rm } from 'node:fs/promises'

const components = 'dist/__app__/react/components.mjs'

if (existsSync('react/index.mjs')) {
  await cp('react/index.mjs', components)
  await rm('react', { force: true, recursive: true })
  consola.success('React bundle moved back to components.mjs')
} else {
  consola.warn('React bundle not found')
}

import { $ as $_ } from 'execa'
import { rm } from 'node:fs/promises'

const $ = $_({
  stderr: 'inherit',
  stdout: 'inherit',
  env: {
    NODE_ENV: 'production',
  },
})

console.info('clean dist')
await rm('dist/', { recursive: true, force: true })

// Run build
await $`pnpm build:turbo`

import consola from 'consola'
import { $ } from 'execa'
import { isProduction } from 'std-env'

if (!isProduction) {
  consola.warn('Type definitions for likec4/react generated only in production mode')
  process.exit(0)
}

// Build type definitions
await $({
  stdout: process.stdout,
  stderr: process.stderr,
  cwd: 'app/react'
})`yarn dts-bundle-generator --config dts-bundle-config.cjs`

consola.success('Generated type definitions for likec4/react')

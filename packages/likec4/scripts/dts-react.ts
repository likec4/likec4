import consola from 'consola'
import { $ as $_ } from 'execa'

const isProduction = process.env.NODE_ENV === 'production'
if (!isProduction) {
  consola.warn('Type definitions for likec4/react generated only in production mode')
  process.exit(0)
}

const $ = $_({
  stdout: process.stdout,
  stderr: process.stderr
})

// Build type definitions
await $({
  cwd: 'app/react'
})`yarn dts-bundle-generator --config dts-bundle-config.cjs`

consola.success('Generated type definitions for likec4/react')

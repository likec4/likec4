import { defineConfig } from '@likec4/styles/dev'
import { isCI, isProduction } from 'std-env'

const notProdOrCI = !isProduction || !isCI

export default defineConfig({
  include: [
    './app/src/**/*.{ts,tsx}',
    './app/webcomponent/**/*.{ts,tsx}',
    './app/react/**/*.{ts,tsx}',
    '../diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
  // During development, we output right away to the shared folder
  // so changes are picked up immediately
  ...(notProdOrCI && ({
    outdir: '../../styled-system/styles/dist',
  })),
})

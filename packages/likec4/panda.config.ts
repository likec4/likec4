import { defineConfig } from '@likec4/styles/dev'
import { isDevelopment } from 'std-env'

export default defineConfig({
  clean: !isDevelopment,
  include: [
    './app/**/*.{ts,tsx}',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  logLevel: isDevelopment ? 'debug' : 'info',
  // During development, we output right away to the shared folder
  // so changes are picked up immediately
  ...(isDevelopment && ({
    outdir: '../../styled-system/styles/dist',
  })),
})

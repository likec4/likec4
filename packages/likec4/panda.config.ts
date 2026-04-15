import { defineConfig } from '@likec4/styles/dev'
import { isDevelopment } from 'std-env'

export default defineConfig({
  clean: !isDevelopment,
  include: [
    './app/**/*.{ts,tsx}',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  outdir: isDevelopment ? '../../styled-system/styles/dist' : 'styled-system',
})

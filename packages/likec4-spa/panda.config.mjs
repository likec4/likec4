import { defineConfig } from '@likec4/style-preset/dev'

export default defineConfig({
  clean: false,
  include: [
    './src/**/*.{ts,tsx}',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  outdir: '../../styled-system/styles/dist',
})

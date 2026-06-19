import { defineConfig } from '@likec4/style-preset/dev'

export default defineConfig({
  clean: isProduction,
  include: [
    './src/**/*.{ts,tsx}',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  outdir: isProduction ? './styled-system' : '../../styled-system/styles/dist',
})

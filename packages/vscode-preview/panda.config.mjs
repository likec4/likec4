import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    'src/**/*.{ts,tsx}',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  cssVarRoot: ':root',
  clean: true,
  outdir: 'styled-system',
})

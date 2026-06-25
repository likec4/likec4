import { defineConfig } from '@likec4/style-preset/dev'

export default defineConfig({
  clean: true,
  include: [
    '../../packages/diagram/src/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
  ],
  outdir: 'styled-system',
})

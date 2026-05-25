import { defineConfig } from '@likec4/style-preset'

export default defineConfig({
  clean: true,
  include: [
    'src/**/*.{ts,tsx}',
    '../../packages/diagram/src/**/*.{ts,tsx}',
  ],
  outdir: 'styled-system',
})

import { defineConfig } from '@likec4/style-preset'

export default defineConfig({
  include: [
    'src/**/*.{ts,tsx}',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  clean: true,
  outdir: 'styled-system',
})

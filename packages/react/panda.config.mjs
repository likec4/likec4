import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    'src/*',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  clean: true,
  outdir: './styled-system',
  cssVarRoot: '.likec4-shadow-root, :host',
})

import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    'src/*.ts',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  clean: true,
  outdir: 'styled-system',
  cssVarRoot: ':where(:host,.likec4-shadow-root)',
})

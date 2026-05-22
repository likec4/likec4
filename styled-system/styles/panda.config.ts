import { defineConfig } from './dev.mjs'

export default defineConfig({
  // The output directory for your css system
  outdir: 'dist',
  clean: true,
  include: [
    '../../packages/diagram/src/**/*.{ts,tsx}',
    '../../packages/likec4-spa/src/**/*.{ts,tsx}',
    '../../packages/vscode-preview/src/**/*.{ts,tsx}',
  ],
})

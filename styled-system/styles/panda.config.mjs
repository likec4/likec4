import { defineConfig } from './dev.mjs'

export default defineConfig({
  include: [
    '../../packages/diagram/src/**/*.{ts,tsx}',
    '../../packages/likec4-spa/src/**/*.{ts,tsx}',
    '../../packages/vscode-preview/src/**/*.{ts,tsx}',
  ],
  outdir: 'dist',
})

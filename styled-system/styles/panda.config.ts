import { defineConfig } from '@likec4/style-preset'

export default defineConfig({
  // The output directory for your css system
  outdir: 'dist',
  clean: false,
  include: [
    '../../packages/diagram/src/**/*.{ts,tsx}',
    '../../packages/likec4-spa/src/**/*.{ts,tsx}',
    '../../packages/vscode-preview/src/**/*.{ts,tsx}',
    '../../apps/playground/src/**/*.{ts,tsx}',
  ],
})

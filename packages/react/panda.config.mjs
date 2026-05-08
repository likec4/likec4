import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    './src/**/*.{ts,tsx}',
    '../diagram/src/**/*.{ts,tsx}',
  ],
  clean: true,
  cssVarRoot: '.likec4-shadow-root, :host',
})

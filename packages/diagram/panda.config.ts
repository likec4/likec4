import likec4preset from '@likec4/style-preset'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  importMap: '@likec4/styles',
  presets: [
    likec4preset,
  ],
  // globalVars: {},
  // jsxFramework: 'react',
  logLevel: 'debug',
  include: [
    // './src/**/*.css.ts',
    // './src/index.css',
    './src/**/*.{ts,tsx}',
    // '..',
    // '../../styled-system/**/vars.ts',
    // '../../packages/diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
  outdir: 'styled-system',
})

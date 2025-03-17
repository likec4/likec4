import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  importMap: '@likec4/styles',
  presets: [
    '@likec4/style-preset',
  ],
  // globalVars: {},
  jsxFramework: 'react',
  include: ['./src/**/*.{js,jsx,ts,tsx}', '../diagram/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      tokens: {
        colors: {},
      },
    },
  },
  // The output directory for your css system
  outdir: 'styled-system',
})

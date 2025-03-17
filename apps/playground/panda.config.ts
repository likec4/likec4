import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    // './src/**/*.css.ts',
    // './src/index.css',
    './src/**/*.{ts,tsx}',
    // '..',
    // '../../styled-system/**/vars.ts',
    '../../packages/diagram/src/**/*.{js,jsx,ts,tsx}',
    // '../../packages/diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
})

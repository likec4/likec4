import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    // './src/**/*.css.ts',
    // './src/index.css',
    './app/src/**/*.{ts,tsx}',
    // '..',
    // '../../styled-system/**/vars.ts',
    '../diagram/src/**/*.{js,jsx,ts,tsx}',
    // '../../packages/diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
})

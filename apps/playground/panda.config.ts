import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    'src/**/*.{ts,tsx}',
    '../../packages/diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
})

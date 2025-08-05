import { defineConfig } from './dev'

export default defineConfig({
  // The output directory for your css system
  outdir: 'dist',
  include: [
    '../../packages/diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
})

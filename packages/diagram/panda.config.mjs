import { defineConfig } from '@likec4/style-preset/dev'

export default defineConfig({
  include: [
    'src/**/*.{ts,tsx}',
  ],
  clean: true,
  outdir: './styled-system',
})

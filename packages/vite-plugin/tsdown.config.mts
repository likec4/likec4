import { defineConfig } from '@likec4/devops/tsdown'
export default defineConfig([{
  entry: './src/index.ts',
}, {
  entry: {
    'index': './src/internal.ts',
  },
  outDir: './dist/internal',
  platform: 'browser',
  target: false,
}])

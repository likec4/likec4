import { stubBrotli } from '@likec4/devops/tsdown'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/standalone.ts'],
  outDir: 'dist',
  format: 'esm',
  clean: true,
  minify: true,
  nodeProtocol: true,
  deps: {
    onlyBundle: false,
  },
  inputOptions: {
    resolve: {
      conditionNames: ['production', 'sources', 'node', 'import', 'default'],
    },
  },
  plugins: [
    stubBrotli(),
  ],
})

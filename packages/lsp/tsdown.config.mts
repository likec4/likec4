import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/standalone.ts'],
  outDir: 'dist',
  format: 'esm',
  clean: true,
  minify: true,
  nodeProtocol: true,
  inlineOnly: false,
  outputOptions: {
    keepNames: true,
  },
  inputOptions: {
    resolve: {
      conditionNames: ['production', 'sources', 'node', 'import', 'default'],
    },
  }
})

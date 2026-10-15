import { defineConfig } from '@likec4/devops/tsdown'

export default defineConfig([
  {
    entry: './src/index.ts',
    platform: 'node',
    unbundle: true,
    minify: false,
  },
  {
    entry: {
      'index': './src/internal.ts',
    },
    outDir: './dist/internal',
    platform: 'neutral',
    target: false,
    minify: false,
    outputOptions: {
      entryFileNames: '[name].mjs',
    },
    deps: {
      onlyBundle: [
        'nanostores',
        '@nanostores/react',
        'birpc',
        'fast-equals',
      ],
    },
  },
])

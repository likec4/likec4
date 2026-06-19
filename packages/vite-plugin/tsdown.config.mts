import { defineConfig } from '@likec4/devops/tsdown'

export default defineConfig([
  {
    entry: './src/index.ts',
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
      alwaysBundle: [
        'remeda',
        'nanostores',
        '@nanostores/react',
      ],
    },
  },
])

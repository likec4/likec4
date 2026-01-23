import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

// @ts-expect-errorf
const isProd = process.env.NODE_ENV === 'production'

export default defineBuildConfig([
  {
    entries: [
      './src/protocol.ts',
      './src/likec4lib.ts',
    ],
    clean: true,
    stub: false,
    failOnWarn: false,
    declaration: isProd,
    externals: [
      'vscode-uri',
      'vscode-jsonrpc',
      'vscode-languageserver-types',
      '@likec4/config',
    ],
    rollup: {
      esbuild: {
        platform: 'neutral',
        minifyIdentifiers: false,
        lineLimit: 500,
      },
      inlineDependencies: false,
    },
  },
  {
    entries: [
      './src/index.ts',
      './src/bundled.ts',
    ],
    clean: false,
    stub: false,
    alias: {
      'raw-body': resolve('./src/empty.ts'),
      'content-type': resolve('./src/empty.ts'),
    },
    failOnWarn: false,
    declaration: isProd,
    externals: [
      resolve('./src/likec4lib.ts'),
    ],
    rollup: {
      esbuild: {
        platform: 'node',
        minifyIdentifiers: false,
        lineLimit: 500,
      },
      inlineDependencies: isProd,
      resolve: {
        exportConditions: ['sources', 'node'],
      },
    },
  },
  {
    entries: [
      './src/browser-worker.ts',
      './src/browser.ts',
    ],
    externals: [
      resolve('./src/likec4lib.ts'),
    ],
    clean: false,
    stub: false,
    failOnWarn: isProd,
    declaration: isProd,
    rollup: {
      esbuild: {
        platform: 'browser',
        minifyIdentifiers: false,
        lineLimit: 500,
      },
      output: {
        hoistTransitiveImports: false,
      },
      inlineDependencies: isProd,
      resolve: {
        browser: true,
        exportConditions: ['sources'],
      },
    },
  },
])

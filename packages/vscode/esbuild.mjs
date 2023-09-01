import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'
import { writeFile } from 'node:fs/promises'
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';

import path from 'node:path'

const watch = process.argv.includes('--watch')
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

const alias = {
  'vscode-uri': 'vscode-uri/lib/esm/index.js',
  '@likec4/core/compute-view': '../core/src/compute-view/index.ts',
  '@likec4/core/utils': '../core/src/utils/index.ts',
  '@likec4/core/errors': '../core/src/errors/index.ts',
  '@likec4/core/types': '../core/src/types/index.ts',
  '@likec4/core/colors': '../core/src/colors.ts',
  '@likec4/core': '../core/src/index.ts',
  '@likec4/diagrams': '../diagrams/src/index.ts',
  '@likec4/generators': '../generators/src/index.ts',
  '@likec4/language-server': '../language-server/src/index.ts',
  '@likec4/layouts': '../layouts/src/index.ts'
}

/**
 * @type {esbuild.BuildOptions}
 */
const nodeCfg = {
  entryPoints: ['src/node/extension.ts', 'src/node/language-server.ts'],
  metafile: isDev,
  logLevel: 'info',
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  external: ['vscode'],
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  alias: {
    ...alias
  },
  color: true,
  sourcemap: true,
  sourcesContent: isDev,
  keepNames: true,
  minify: !isDev,
  legalComments: 'none',
}

/**
 * @type {esbuild.BuildOptions}
 */
const webCfg = {
  entryPoints: ['src/browser/extension.ts'],
  metafile: isDev,
  logLevel: 'info',
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  format: 'cjs',
  target: 'es2022',
  platform: 'browser',
  mainFields: ['browser', 'module', 'main'],
  external: ['vscode'],
  alias: {
    ...alias
  },
  color: true,
  allowOverwrite: true,
  sourcemap: true,
  sourcesContent: isDev,
  keepNames: true,
  minify: !isDev,
  legalComments: 'none',
  plugins: [
    nodeModulesPolyfillPlugin({
      globals: {
        process: true
      }
    })
  ]
}
/**
 * @type {esbuild.BuildOptions}
 */
const webWorkerCfg = {
  ...webCfg,
  entryPoints: ['src/browser/language-server-worker.ts'],
  format: 'iife'
}

if (!watch) {
  const bundles = await Promise.all([
    esbuild.build(nodeCfg),
    esbuild.build(webCfg),
    esbuild.build(webWorkerCfg)
  ])

  const [nodeBundle, webBundle, webWorkerBundle] = bundles

  if (nodeBundle.metafile) {
    const metafile = path.resolve('dist', 'node', 'extension.metafile.json')
    await writeFile(metafile, JSON.stringify(nodeBundle.metafile))
  }
  if (webBundle.metafile) {
    const metafile = path.resolve('dist', 'browser', 'extension.metafile.json')
    await writeFile(metafile, JSON.stringify(webBundle.metafile))
  }
  if (webWorkerBundle.metafile) {
    const metafile = path.resolve('dist', 'browser', 'web-worker.metafile.json')
    await writeFile(metafile, JSON.stringify(webBundle.metafile))
  }

  const errors = bundles.flatMap(b => b.errors)
  const warnings = bundles.flatMap(b => b.warnings)
  if (errors.length || warnings.length) {
    console.error(
      [
        ...formatMessagesSync(warnings, {
          kind: 'warning',
          color: true,
          terminalWidth: process.stdout.columns
        }),
        ...formatMessagesSync(errors, {
          kind: 'error',
          color: true,
          terminalWidth: process.stdout.columns
        })
      ].join('\n')
    )
    console.error('\n ⛔️ Build failed')
    process.exit(1)
  }
  process.exit(0)
}

const [nodeCtx, webCtx, webWorkerCtx] = await Promise.all([
  esbuild.context(nodeCfg),
  esbuild.context(webCfg),
  esbuild.context(webWorkerCfg)
])
await nodeCtx.watch()
await webCtx.watch()
await webWorkerCtx.watch()
console.info(' 👀 watching...')

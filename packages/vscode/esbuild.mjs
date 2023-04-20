import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const minify = process.argv.includes('--minify')
const watch = process.argv.includes('--watch')

const alias = {
  'vscode-uri': '../../node_modules/vscode-uri/lib/esm/index.js',
  'vscode-languageserver-types': '../../node_modules/vscode-languageserver-types/lib/esm/main.js',
  'vscode-languageserver-textdocument': '../../node_modules/vscode-languageserver-textdocument/lib/esm/main.js'
}

/**
 * @type {esbuild.BuildOptions}
 */
const nodeCfg = {
  entryPoints: [
    'src/extension/node/index.ts',
    'src/extension/node/server.ts'
  ],
  metafile: true,
  logLevel: 'info',
  outbase: 'src/extension',
  outdir: 'dist',
  conditions: ['module','import'],
  bundle: true,
  external: ['vscode'],
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  alias: {
    ...alias
  },
  color: true,
  allowOverwrite: true,
  sourcemap: true,
  sourcesContent: false,
  minify
}

/**
 * @type {esbuild.BuildOptions}
 */
const webCfg = {
  entryPoints: [
    'src/extension/web/index.ts',
  ],
  metafile: true,
  logLevel: 'info',
  outbase: 'src/extension',
  outdir: 'dist',
  bundle: true,
  format: 'cjs',
  target: 'es2020',
  platform: 'browser',
  external: ['vscode'],
  mainFields: ['browser', 'module', 'main'],
  alias: {
    path: 'path-browserify',
    ...alias
  },
  color: true,
  allowOverwrite: true,
  sourcemap: true,
  sourcesContent: false,
  minify
}
/**
 * @type {esbuild.BuildOptions}
 */
const webWorkerCfg = {
  ...webCfg,
  entryPoints: [
    'src/extension/web/server-worker.ts',
  ],
  format: 'iife'
}

if (!watch) {
  const bundles = await Promise.all([
    esbuild.build(nodeCfg),
    esbuild.build(webCfg),
    esbuild.build(webWorkerCfg)
  ])

  if (!minify) {
    const [nodeBundle, webBundle, webWorkerBundle] = bundles
    if (nodeBundle.metafile) {
      const metafile = path.resolve('dist', 'node', 'metafile.json')
      await writeFile(metafile, JSON.stringify(nodeBundle.metafile))
    }
    if (webBundle.metafile) {
      const metafile = path.resolve('dist', 'web', 'index-metafile.json')
      await writeFile(metafile, JSON.stringify(webBundle.metafile))
    }
    if (webWorkerBundle.metafile) {
      const metafile = path.resolve('dist', 'web', 'worker-metafile.json')
      await writeFile(metafile, JSON.stringify(webBundle.metafile))
    }
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
  esbuild.context(webWorkerCfg),
])
await nodeCtx.watch()
await webCtx.watch()
await webWorkerCtx.watch()
console.info(' 👀 watching...')

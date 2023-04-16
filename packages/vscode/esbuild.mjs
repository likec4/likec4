import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'

const watch = process.argv.includes('--watch')

/**
 * @type {esbuild.BuildOptions}
 */
const nodeCfg = {
  entryPoints: {
    index: 'src/extension/node/index.ts',
    server: 'src/extension/node/server.ts'
  },
  logLevel: 'info',
  outdir: 'dist/node',
  bundle: true,
  external: ['vscode'],
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  color: true,
  allowOverwrite: true,
  sourcemap: 'external',
  sourcesContent: true,
  treeShaking: true
}

/**
 * @type {esbuild.BuildOptions}
 */
const webCfg = {
  entryPoints: {
    index: 'src/extension/browser/index.ts',
    server: 'src/extension/browser/server.ts'
  },
  logLevel: 'info',
  outdir: 'dist/browser',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  external: ['vscode'],
  mainFields: ['browser', 'module', 'main'],
  alias: {
    path: 'path-browserify'
  },
  color: true,
  allowOverwrite: true,
  sourcemap: 'external',
  sourcesContent: true,
  treeShaking: true
}

if (!watch) {
  const bundles = await Promise.all([
    esbuild.build(nodeCfg),
    esbuild.build(webCfg)
  ])
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

const [nodeCtx, webCtx] = await Promise.all([
  esbuild.context(nodeCfg),
  esbuild.context(webCfg)
])
await nodeCtx.watch()
await webCtx.watch()
console.info(' 👀 watching...')

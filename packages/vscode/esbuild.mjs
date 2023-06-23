import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const watch = process.argv.includes('--watch')

const alias = {
  // 'vscode-uri': 'vscode-uri/lib/esm/index.js',
  'langium/node': 'langium/src/node/index.ts',
  'langium/lib/workspace': 'langium/src/workspace/index.ts',
  'langium/lib/generator': 'langium/src/generator/index.ts',
  langium: 'langium/src/index.ts',
  // "@likec4/core/compute-view": '../core/src/compute-view/index.ts',
  // "@likec4/core/utils": '../core/src/utils/index.ts',
  // "@likec4/core/types": '../core/src/types/index.ts',
  // "@likec4/core": '../core/src/index.ts',
  // "@likec4/generators": '../generators/src/index.ts',
  // "@likec4/language-protocol": '../language-protocol/src/protocol.ts',
  // "@likec4/language-server/protocol": '../language-server/src/protocol.ts',
  // "@likec4/language-server": '../language-server/src/index.ts',
  // "@likec4/layouts": '../layouts/src/index.ts',
  // 'vscode-languageserver-types': 'vscode-languageserver-types/lib/esm/main.js',
  // 'vscode-languageserver-textdocument': 'vscode-languageserver-textdocument/lib/esm/main.js'
}

/**
 * @type {esbuild.BuildOptions}
 */
const nodeCfg = {
  entryPoints: ['src/node.ts', 'src/lsp/node.ts'],
  metafile: true,
  logLevel: 'info',
  outdir: 'dist',
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
  treeShaking: true,
  keepNames: true,
  minify: true
}

/**
 * @type {esbuild.BuildOptions}
 */
const webCfg = {
  entryPoints: ['src/web.ts'],
  metafile: true,
  logLevel: 'info',
  outbase: 'src',
  outdir: 'dist',
  bundle: true,
  format: 'cjs',
  target: 'es2020',
  platform: 'browser',
  external: ['vscode'],
  alias: {
    path: 'path-browserify',
    ...alias
  },
  color: true,
  allowOverwrite: true,
  sourcemap: true,
  sourcesContent: false,
  treeShaking: true,
  keepNames: true,
  minify: true
}
/**
 * @type {esbuild.BuildOptions}
 */
const webWorkerCfg = {
  ...webCfg,
  entryPoints: ['src/lsp/web-worker.ts'],
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
    const metafile = path.resolve('dist', 'node.metafile.json')
    await writeFile(metafile, JSON.stringify(nodeBundle.metafile))
  }
  if (webBundle.metafile) {
    const metafile = path.resolve('dist', 'web.metafile.json')
    await writeFile(metafile, JSON.stringify(webBundle.metafile))
  }
  if (webWorkerBundle.metafile) {
    const metafile = path.resolve('dist', 'lsp', 'web-worker.metafile.json')
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

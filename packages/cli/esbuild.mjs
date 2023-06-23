import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'

const watch = process.argv.includes('--watch')

/**
 * @type {esbuild.BuildOptions}
 */
const cli = {
  entryPoints: ['src/cli.ts'],
  outfile: 'dist/cli.js',
  logLevel: 'info',
  bundle: true,
  format: 'iife',
  target: 'node16',
  platform: 'node',
  alias: {
    'langium/node': 'langium/src/node/index.ts',
    'langium/lib/workspace': 'langium/src/workspace/index.ts',
    'langium/lib/generator': 'langium/src/generator/index.ts',
    'langium': 'langium/src/index.ts',
    "@likec4/core/compute-view": '../core/src/compute-view/index.ts',
    "@likec4/core/utils": '../core/src/utils/index.ts',
    "@likec4/core/types": '../core/src/types/index.ts',
    "@likec4/core": '../core/src/index.ts',
    "@likec4/generators": '../generators/src/index.ts',
    "@likec4/language-protocol": '../language-protocol/src/protocol.ts',
    "@likec4/language-server": '../language-server/src/index.ts',
    "@likec4/layouts": '../layouts/src/index.ts'
  },
  color: true,
  allowOverwrite: true,
  sourcemap: false,
  sourcesContent: false,
  treeShaking: true,
  keepNames: true,
  legalComments: 'eof',
  minify: true
}

/**
 * @type {esbuild.BuildOptions}
 */
const exportPage = {
  entryPoints: ['src/export/puppeteer-page/index.tsx'],
  outfile: 'dist/puppeteer-page.js',
  logLevel: 'info',
  bundle: true,
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  color: true,
  allowOverwrite: true,
  treeShaking: true,
  minify: true
}

/**
 *
 * @param {esbuild.BuildResult} bundle
 */
function failIfError(bundle) {
  if (bundle.warnings.length || bundle.errors.length) {
    console.error(
      [
        ...formatMessagesSync(bundle.warnings, {
          kind: 'warning',
          color: true,
          terminalWidth: process.stdout.columns
        }),
        ...formatMessagesSync(bundle.errors, {
          kind: 'error',
          color: true,
          terminalWidth: process.stdout.columns
        })
      ].join('\n')
    )
    console.error('\n ⛔️ Build failed')
    process.exit(1)
  }
}

if (!watch) {
  failIfError(await esbuild.build(cli))
  failIfError(await esbuild.build(exportPage))

  process.exit(0)
}

const cliCtx = await esbuild.context(cli)
const exportPageCtx = await esbuild.context(exportPage)
await cliCtx.watch()
await exportPageCtx.watch()
console.info(' 👀 watching...')

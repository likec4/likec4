import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'

const watch = process.argv.includes('--watch')

/**
 * @type {esbuild.BuildOptions}
 */
const options = {
  entryPoints: ['src/cli.ts'],
  outfile: 'dist/likec4.js',
  logLevel: 'info',
  bundle: true,
  format: 'iife',
  target: 'node16',
  platform: 'node',
  alias: {
    'langium/node': 'langium/src/node/index.ts',
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

if (!watch) {
  const bundle = await esbuild.build(options)
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
  process.exit(0)
}

const ctx = await esbuild.context(options)
await ctx.watch()
console.info(' 👀 watching...')

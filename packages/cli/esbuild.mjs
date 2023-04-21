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
  mainFields: ['module', 'main'],
  bundle: true,
  format: 'iife',
  target: 'node16',
  platform: 'node',
  define: {
    'process.env.NODE_ENV': 'production'
  },
  alias: {
    'vscode-uri': 'vscode-uri/lib/esm/index.js',
    langium: 'langium/src/index.ts',
    'langium/node': 'langium/src/node/index.ts',
    'vscode-languageserver-types': 'vscode-languageserver-types/lib/esm/main.js',
    'vscode-languageserver-textdocument': 'vscode-languageserver-textdocument/lib/esm/main.js'
  },
  color: true,
  allowOverwrite: true,
  sourcemap: false,
  sourcesContent: false,
  treeShaking: true,
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

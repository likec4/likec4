import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'

const watch = process.argv.includes('--watch')

const alias = {
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
const cli = {
  entryPoints: ['src/cli.ts'],
  outdir: 'dist',
  logLevel: 'info',
  bundle: true,
  loader: {
    '.html': 'text',
  },
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  alias,
  color: true,
  sourcemap: false,
  keepNames: true,
  legalComments: 'eof',
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
  process.exit(0)
}

const cliCtx = await esbuild.context(cli)
await cliCtx.watch()
console.info(' 👀 watching...')

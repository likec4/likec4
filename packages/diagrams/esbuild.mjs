import * as esbuild from 'esbuild'
import { formatMessagesSync } from 'esbuild'
import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin'

const watch = process.argv.includes('--watch')

/**
 * @type {esbuild.BuildOptions}
 */
const cfg = {
  entryPoints: ['src/index.ts'],
  plugins: [
    vanillaExtractPlugin({
      // runtime: true
    })
  ],
  logLevel: 'info',
  color: true,
  allowOverwrite: true,
  bundle: true,
  platform: 'browser',
  format: 'esm',
  outfile: 'dist/index.js',
  minify: true,
  metafile: true,
  sourcemap: true,
  sourcesContent: false,
  jsx: 'automatic',
  external: [
    'react',
    'react-dom'
  ]
  // external: Object.keys({
  //   ...packageJson.dependencies,
  //   ...packageJson.peerDependencies
  // })
}

if (!watch) {
  const bundle = await esbuild.build(cfg)

  // if (bundle.metafile) {
  //   console.log(
  //     await esbuild.analyzeMetafile(bundle.metafile, {
  //       // verbose: true
  //     })
  //   )
  // }

  if (bundle.errors.length || bundle.warnings.length) {
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

  console.info(' Build CJS...')
  await esbuild.build({
    ...cfg,
    metafile: false,
    logLevel: 'warning',
    plugins: [],
    format: 'cjs',
    outfile: 'dist/index.cjs'
  })

  process.exit(0)
}

const ctx = await esbuild.context(cfg)
await ctx.watch()
console.info(' 👀 watching...')

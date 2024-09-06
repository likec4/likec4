import consola from 'consola'
import { build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { env } from 'node:process'
import { amIExecuted } from './_utils'

const isProd = env['NODE_ENV'] === 'production' || env['NODE_ENV'] === 'prod'

export async function buildCli(isDev = !isProd) {
  throw new Error('Use unbuild instead')

  //   if (isDev) {
  //     consola.warn('⚠️ LikeC4 CLI DEVELOPMENT bundle')
  //   } else {
  //     consola.start(`LikeC4 CLI production bundle`)
  //   }

  //   const cfg: BuildOptions = {
  //     metafile: isDev,
  //     logLevel: isDev ? 'debug' : 'info',
  //     outdir: 'dist',
  //     outbase: 'src',
  //     outExtension: {
  //       '.js': '.mjs'
  //     },
  //     color: true,
  //     bundle: true,
  //     splitting: true,
  //     sourcemap: isDev,
  //     keepNames: false,
  //     minify: true,
  //     treeShaking: true,
  //     legalComments: 'none',
  //     entryPoints: [
  //       'src/cli/index.ts',
  //       'src/index.ts'
  //     ],
  //     ...(!isDev && {
  //       define: {
  //         'process.env.NODE_ENV': '"production"'
  //       }
  //     }),
  //     format: 'esm',
  //     target: 'node20',
  //     platform: 'node',
  //     alias: {
  //       '@likec4/core/model': resolve('../core/src/model/index.ts'),
  //       '@likec4/core/types': resolve('../core/src/types/index.ts'),
  //       '@likec4/language-server': resolve('../language-server/src/index.ts'),
  //       '@likec4/core': resolve('../core/src/index.ts'),
  //       '@/vite/config-app': '@/vite/config-app.prod',
  //       '@/vite/config-react': '@/vite/config-react.prod',
  //       '@/vite/config-webcomponent': '@/vite/config-webcomponent.prod'
  //     },
  //     banner: {
  //       js: `
  // import { createRequire as createRequire_ } from 'module';
  // const require = createRequire_(import.meta.url);
  // `
  //     },
  //     plugins: [
  //       nodeExternalsPlugin({
  //         dependencies: true,
  //         optionalDependencies: true,
  //         devDependencies: false,
  //         allowList: [
  //           '@likec4/core'
  //         ]
  //       })
  //     ]
  //   }

  //   const bundle = await build(cfg)
  //   if (bundle.errors.length || bundle.warnings.length) {
  //     consola.error(
  //       [
  //         ...formatMessagesSync(bundle.warnings, {
  //           kind: 'warning',
  //           color: true,
  //           terminalWidth: process.stdout.columns
  //         }),
  //         ...formatMessagesSync(bundle.errors, {
  //           kind: 'error',
  //           color: true,
  //           terminalWidth: process.stdout.columns
  //         })
  //       ].join('\n')
  //     )
  //     consola.error('\n ⛔️ Build failed')
  //     process.exit(1)
  //   }
  //   if (bundle.metafile) {
  //     await writeFile('dist/metafile.json', JSON.stringify(bundle.metafile))
  //   }
}

if (amIExecuted(import.meta.filename)) {
  consola.info('Running as script')
  await buildCli()
}

import { consola } from 'consola'
import { build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import assert from 'node:assert'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { bundleApp } from './bundle-app'
import { buildWebcomponentBundle } from './bundle-webcomponent'

// const watch = process.argv.includes('--watch')
const isDev = process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'prod'
if (isDev) {
  consola.warn('likec4 build isDev=true')
}

async function buildCli() {
  consola.start('Building CLI...')
  const cfg: BuildOptions = {
    metafile: isDev,
    logLevel: 'info',
    outdir: 'dist',
    outbase: 'src',
    outExtension: {
      '.js': '.mjs'
    },
    color: true,
    bundle: true,
    sourcemap: isDev,
    sourcesContent: isDev,
    keepNames: isDev,
    minify: !isDev,
    treeShaking: !isDev,
    legalComments: 'none',
    mainFields: ['module', 'main'],
    entryPoints: ['src/cli/index.ts'],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    format: 'esm',
    target: 'node18',
    platform: 'node',
    alias: {
      '@/vite/config': '@/vite/config.prod',
      '@/vite/webcomponent': '@/vite/webcomponent.prod'
    },
    banner: {
      js: 'import { createRequire as crReq } from \'module\'; const require = crReq(import.meta.url);'
    },
    plugins: [
      nodeExternalsPlugin({
        dependencies: true,
        optionalDependencies: true,
        devDependencies: false,
        allowList: [
          'fast-equals'
        ]
      })
    ]
  }

  const bundle = await build(cfg)
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
  if (bundle.metafile) {
    await writeFile('dist/cli/metafile.json', JSON.stringify(bundle.metafile))
  }
}
consola.info('clean dist')
await rm('dist/', { recursive: true, force: true })

consola.info(`create dist/__app__/src`)
await mkdir('dist/__app__/src', { recursive: true })

await buildCli()
consola.log('\n-------\n')

await bundleApp()
consola.info(`copy app files to dist/__app__`)
await copyFile('app/index.html', 'dist/__app__/index.html')
await copyFile('app/robots.txt', 'dist/__app__/robots.txt')
await copyFile('app/favicon.ico', 'dist/__app__/favicon.ico')
await copyFile('app/favicon.svg', 'dist/__app__/favicon.svg')
await copyFile('app/src/main.js', 'dist/__app__/src/main.js')
consola.log('\n-------\n')

await buildWebcomponentBundle()

const verifyStyles = await readFile('dist/__app__/src/lib/style.css', 'utf-8')
assert(verifyStyles.startsWith('body{'), 'webcomponent style.css should start with "body{"')

await rm('dist/__app__/src/lib/style.css')

// await writeFile(
//   'dist/__app__/tsconfig.json',
//   JSON.stringify(
//     {
//       '$schema': 'https://json.schemastore.org/tsconfig',
//       'compilerOptions': {
//         'target': 'ES2020',
//         'lib': [
//           'DOM',
//           'DOM.Iterable',
//           'ESNext'
//         ],
//         'allowJs': true,
//         'module': 'ESNext',
//         'outDir': './dist',
//         'strict': false,
//         'esModuleInterop': true,
//         'isolatedModules': true,
//         'jsx': 'react-jsx',
//         'rootDir': '.',
//         'types': [
//           'vite/client'
//         ]
//       },
//       'include': [
//         './src'
//       ]
//     },
//     null,
//     2
//   )
// )

import { consola } from 'consola'
import { build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { bundleApp } from './bundle-app'
import { buildWebcomponentBundle } from './bundle-webcomponent'

// const watch = process.argv.includes('--watch')
const isDev = process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'prod'
if (isDev) {
  consola.warn('likec4 development build')
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
        devDependencies: false
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
let indexHtml = await readFile('app/index.html', 'utf-8')
indexHtml = indexHtml.replace('%VITE_HTML_DEV_INJECT%', '')
await writeFile('dist/__app__/index.html', indexHtml)

await Promise.all([
  copyFile('app/robots.txt', 'dist/__app__/robots.txt'),
  copyFile('app/favicon.ico', 'dist/__app__/favicon.ico'),
  copyFile('app/favicon.svg', 'dist/__app__/favicon.svg'),
  copyFile('app/src/main.js', 'dist/__app__/src/main.js')
])

consola.log('\n-------\n')

await buildWebcomponentBundle()

// const verifyStyles = await readFile('dist/__app__/src/lib/style.css', 'utf-8')
// assert(verifyStyles.startsWith('body{'), 'webcomponent style.css should start with "body{"')

await rm('dist/__app__/src/lib/style.css')

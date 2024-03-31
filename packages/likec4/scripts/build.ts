import { consola } from 'consola'
import { build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import json5 from 'json5'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { buildAppBundle } from './build-app'

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
    color: true,
    bundle: true,
    sourcemap: true,
    sourcesContent: isDev,
    keepNames: true,
    minify: !isDev,
    treeShaking: true,
    legalComments: 'none',
    mainFields: ['module', 'main'],
    entryPoints: ['src/cli/index.ts'],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    format: 'esm',
    target: 'esnext',
    platform: 'node',
    alias: {
      '@/vite/config': '@/vite/config.prod'
    },
    banner: {
      js: 'import { createRequire as crReq } from \'module\'; const require = crReq(import.meta.url);'
    },
    tsconfig: 'tsconfig.src.json',
    plugins: [
      nodeExternalsPlugin({
        devDependencies: false,
        allowWorkspaces: false,
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
  consola.success('Built CLI')
}
consola.log('clean dist')
await rm('dist/', { recursive: true, force: true })
await buildCli()

consola.log(`copy app files to dist/__app__`)
await mkdir('dist/__app__', { recursive: true })
await cp('app/', 'dist/__app__/', {
  recursive: true,
  filter: src =>
    !src.includes('tsconfig.')
    && !src.endsWith('.css')
    && !src.endsWith('.ts')
    && !src.endsWith('.tsx')
})

await buildAppBundle()

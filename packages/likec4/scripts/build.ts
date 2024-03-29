import { build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import k from 'picocolors'
import { buildAppBundle } from './build-app'

// const watch = process.argv.includes('--watch')
const isDev = process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'prod'
if (isDev) {
  console.info(k.yellow(`⚠️ likec4 build isDev=${isDev}`))
} else {
  console.info(k.green(`⚠️ likec4 build isDev=${isDev}`))
}

async function buildCli() {
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
}

console.info(k.gray(`\n clean dist`))
await rm('dist/', { recursive: true, force: true })

await buildCli()

console.info(k.gray(`\n copy app files to dist/__app__`))
await mkdir('dist/__app__', { recursive: true })
await cp('app/', 'dist/__app__/', {
  recursive: true,
  filter: src =>
    !src.includes('tsconfig.')
    && !src.endsWith('.css')
    && !src.endsWith('.ts')
    && !src.endsWith('.tsx')
})

console.info(k.gray(`\n built app bundle`))
await buildAppBundle()

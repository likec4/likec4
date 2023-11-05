import { build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { $ } from 'execa'
import json5 from 'json5'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// const watch = process.argv.includes('--watch')
const isDev = process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'prod'
console.info(`⚠️ likec4 build isDev=${isDev}`)

async function buildCli() {
  const cfg: BuildOptions = {
    metafile: isDev,
    logLevel: 'info',
    outdir: 'dist',
    outbase: 'src',
    color: true,
    bundle: true,
    sourcemap: isDev,
    sourcesContent: isDev,
    keepNames: true,
    minify: !isDev,
    treeShaking: true,
    legalComments: 'none',
    entryPoints: ['src/cli/index.ts'],
    format: 'esm',
    target: 'node18',
    platform: 'node',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
    alias: {
      // p-limit
      '#async_hooks': 'node:async_hooks',
    },
    plugins: [
      nodeExternalsPlugin({
        // bundle devDependencies
        devDependencies: false,
        // bundle
        allowList: [
          '@likec4/core',
          '@likec4/diagrams',
          'remeda',
          'rambdax',
          'safe-stable-stringify',
          'ts-custom-error'
        ]
      })
    ]
  }

  const bundle = await build(cfg)
  if (bundle.warnings.length) {
    console.warn(
      formatMessagesSync(bundle.warnings, {
        kind: 'warning',
        color: true,
        terminalWidth: process.stdout.columns
      }).join('\n')
    )
  }
  if (bundle.errors.length) {
    console.error(
      formatMessagesSync(bundle.errors, {
        kind: 'error',
        color: true,
        terminalWidth: process.stdout.columns
      }).join('\n')
    )
    console.error('\n ⛔️ Build failed')
    process.exit(1)
  }
}

const $$ = $({
  stderr: 'inherit',
  stdout: 'inherit'
})

await rm('dist', { recursive: true, force: true })
await buildCli()
await mkdir('dist/__app__')
await cp('app/', 'dist/__app__/', {
  recursive: true,
  filter: src => !src.endsWith('.ts') && !src.endsWith('.tsx')
})
await $$`tsc -p ./app/tsconfig.json`

const tsconfig = json5.parse(await readFile('app/tsconfig.json', 'utf8'))
tsconfig.compilerOptions.outDir = 'dist'
delete tsconfig.compilerOptions.plugins
delete tsconfig.references
await writeFile('dist/__app__/tsconfig.json', JSON.stringify(tsconfig, null, 2))

console.info(`✔️ copied app files to dist/__app__`)

await mkdir('dist/@likec4/core', { recursive: true })
await cp('../core/dist/esm/', 'dist/@likec4/core/', { recursive: true })
console.info(`✔️ copied @likec4/core to dist`)

await mkdir('dist/@likec4/diagrams')
await cp('../diagrams/dist/', 'dist/@likec4/diagrams/', { recursive: true })
console.info(`✔️ copied @likec4/diagrams to dist`)

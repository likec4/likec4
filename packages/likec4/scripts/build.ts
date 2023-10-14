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
  const alias = {
    // '@likec4/core/utils': resolve('../core/src/utils/index.ts'),
    // '@likec4/core/types': resolve('../core/src/types/index.ts'),
    // '@likec4/core/colors': resolve('../core/src/colors.ts'),
    // '@likec4/core': resolve('../core/src/index.ts'),
    // '@likec4/diagrams': resolve('../diagrams/src/index.ts'),
    // '@likec4/generators': resolve('../generators/src/index.ts'),
    // '@likec4/language-server': resolve('../language-server/src/index.ts'),
    // '@likec4/layouts': resolve('../layouts/src/index.ts')
  }

  const cfg: BuildOptions = {
    metafile: isDev,
    logLevel: 'info',
    outdir: 'dist',
    outbase: 'src',
    color: true,
    bundle: true,
    alias,
    sourcemap: true,
    sourcesContent: isDev,
    keepNames: true,
    minify: !isDev,
    treeShaking: true,
    legalComments: 'none',
    entryPoints: ['src/cli/index.ts'],
    format: 'esm',
    target: 'esnext',
    platform: 'node',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
    plugins: [
      nodeExternalsPlugin({
        devDependencies: false,
        allowList: [
          '@likec4/core',
          '@likec4/diagrams',
          '@likec4/layouts',
          '@likec4/generators',
          '@likec4/language-server',
          'remeda',
          'rambdax',
          '@dagrejs/graphlib',
          'safe-stable-stringify',
          'ts-custom-error'
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
}

await rm('dist', { recursive: true, force: true })
await buildCli()
await mkdir('dist/__app__')
await cp('app/', 'dist/__app__/', {
  recursive: true,
  filter: src => !src.endsWith('.ts') && !src.endsWith('.tsx')
})
await $({ all: true })`tsc -p ./app/tsconfig.json`

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

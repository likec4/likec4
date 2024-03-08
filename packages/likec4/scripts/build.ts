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
      js: 'import { createRequire as crReq } from \'module\'; const require = crReq(import.meta.url);'
    },
    tsconfig: 'tsconfig.src.json',
    plugins: [
      nodeExternalsPlugin({
        devDependencies: false,
        allowWorkspaces: true,
        allowList: [
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
  if (bundle.metafile) {
    await writeFile('dist/cli/metafile.json', JSON.stringify(bundle.metafile))
  }
}

await rm('dist', { recursive: true, force: true })
await buildCli()
await mkdir('dist/__app__')
await cp('app/', 'dist/__app__/', {
  recursive: true,
  filter: src =>
    !src.includes('tsconfig.')
    && !src.endsWith('.ts')
    && !src.endsWith('.tsx')
})
await $({
  all: true
})`tsc -p ./app/tsconfig.json --composite false --declarationMap false --declaration false --incremental false --tsBuildInfoFile null`

// const tsconfig = json5.parse(await readFile('app/tsconfig.json', 'utf8'))
// tsconfig.compilerOptions.outDir = 'dist'
// delete tsconfig.compilerOptions.plugins
// delete tsconfig.references
// delete tsconfig.extends
// await writeFile('dist/__app__/tsconfig.json', JSON.stringify(tsconfig, null, 2))

console.info(`✔️ copied app files to dist/__app__`)

await mkdir('dist/@likec4/core', { recursive: true })
await cp('../core/dist/esm/', 'dist/@likec4/core/', { recursive: true })
console.info(`✔️ copied @likec4/core to dist`)

await mkdir('dist/@likec4/diagrams')
await cp('../diagrams/dist/', 'dist/@likec4/diagrams/', { recursive: true })
console.info(`✔️ copied @likec4/diagrams to dist`)

await mkdir('dist/@likec4/diagram')
await cp('../diagram/dist/', 'dist/@likec4/diagram/', { recursive: true })
console.info(`✔️ copied @likec4/diagram to dist`)

import { consola } from 'consola'
import { analyzeMetafileSync, build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill'
import { existsSync, writeFileSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'

import path, { resolve } from 'node:path'

const isDev = process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'prod'
if (isDev) {
  consola.warn('VSCODE DEVELOPMENT BUILD')
}

const vscodePreview = resolve('../vscode-preview/dist/')
if (!existsSync(vscodePreview)) {
  consola.error(`"${vscodePreview}" not found`)
  process.exit(1)
}
consola.info('Copy vscode preview')

await mkdir('dist/preview', { recursive: true })
await cp(
  vscodePreview,
  'dist/preview',
  { recursive: true }
)


consola.start('Build vscode extension')

const base = {
  metafile: isDev,
  outdir: 'dist',
  outbase: 'src',
  // logLevel: isDev ? 'debug' : 'info',
  logLevel: 'info',
  color: true,
  bundle: true,
  external: isDev ? [
    'vscode',
    '@hpcc-js/wasm',
  ] : [
    'vscode',
  ],
  ...(!isDev && {
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }),
  sourcemap: true,
  sourcesContent: isDev,
  minify: !isDev,
  legalComments: 'none'
} satisfies BuildOptions

const configs = [] as BuildOptions[]

// ----------- Node

configs.push({
  ...base,
  entryPoints: [
    'src/node/extension.ts',
    'src/node/language-server.ts'
  ],
  format: 'cjs',
  target: 'node18',
  platform: 'node'
})

// ----------- Browser

configs.push({
  ...base,
  entryPoints: ['src/browser/extension.ts'],
  format: 'cjs',
  target: 'es2022',
  platform: 'browser',
  plugins: [nodeModulesPolyfillPlugin()]
})

configs.push({
  ...base,
  entryPoints: ['src/browser/language-server-worker.ts'],
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  plugins: [nodeModulesPolyfillPlugin()]
})

let hasErrors = false
const bundles = await Promise.all(configs.map(cfg => build(cfg)))

bundles.forEach(({ errors, warnings, metafile }) => {
  if (metafile) {
    analyzeMetafileSync(metafile)
    const out = Object.keys(metafile.outputs).find(k => k.endsWith('.js'))
    if (out) {
      const metafilepath = path.resolve(out + '.metafile.json')
      writeFileSync(metafilepath, JSON.stringify(metafile))
      consola.debug(metafilepath)
    }
  }
  if (errors.length) {
    hasErrors = true
    consola.error(formatMessagesSync(errors, {
      kind: 'error',
      color: true,
      terminalWidth: process.stdout.columns
    }))
  }
  if (warnings.length) {
    consola.warn(formatMessagesSync(warnings, {
      kind: 'warning',
      color: true,
      terminalWidth: process.stdout.columns
    }))
  }
})

if (hasErrors) {
  consola.error('⛔️ Build failed')
  process.exit(1)
}

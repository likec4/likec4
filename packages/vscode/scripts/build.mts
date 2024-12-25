import { consola } from 'consola'
import { type BuildOptions, analyzeMetafileSync, build, formatMessagesSync } from 'esbuild'
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill'
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { isProduction } from 'std-env'

import { resolve } from 'node:path'

const isDev = !isProduction
if (isDev) {
  consola.warn('VSCODE DEVELOPMENT BUILD')
}

function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }
  consola.info('Cleaning: %s', dir)
  for (const file of readdirSync(dir)) {
    rmSync(resolve(dir, file), { recursive: true, force: true })
  }
}

const vscodePreview = resolve('../vscode-preview/dist/')
if (!existsSync(vscodePreview)) {
  consola.error(`"${vscodePreview}" not found`)
  process.exit(1)
}
consola.info('Copy vscode preview')

emptyDir('dist')
await mkdir('dist/preview', { recursive: true })
await cp(
  vscodePreview,
  'dist/preview',
  { recursive: true },
)

consola.start('Build vscode extension')

const base = {
  metafile: isDev,
  outdir: 'dist',
  outbase: 'src',
  logLevel: isDev ? 'debug' : 'warning',
  color: true,
  bundle: true,
  treeShaking: true,
  external: isProduction ? ['vscode'] : [
    'vscode',
    '@vscode/extension-telemetry',
    // '@hpcc-js/wasm-graphviz'
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  sourcemap: true,
  sourcesContent: false,
  minify: isProduction,
  minifyIdentifiers: false,
  minifySyntax: isProduction,
  minifyWhitespace: isProduction,
  legalComments: 'none',
} satisfies BuildOptions

const configs = [] as BuildOptions[]

// ----------- Node

configs.push({
  ...base,
  entryPoints: [
    'src/node/extension.ts',
    'src/node/language-server.ts'
  ],
  target: 'node20',
  platform: 'node',
  conditions: isProduction ? ['node', 'production'] : ['development'],
})

// ----------- Browser

configs.push({
  ...base,
  sourcemap: isDev,
  minifyIdentifiers: isProduction,
  entryPoints: ['src/browser/extension.ts'],
  format: 'cjs',
  target: 'es2022',
  platform: 'browser',
  plugins: [nodeModulesPolyfillPlugin()],
  conditions: isProduction ? ['browser', 'production'] : ['development'],
}, {
  ...base,
  sourcemap: isDev,
  minifyIdentifiers: isProduction,
  entryPoints: ['src/browser/language-server-worker.ts'],
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  plugins: [nodeModulesPolyfillPlugin()],
  conditions: isProduction ? ['browser', 'production'] : ['development'],
})

let hasErrors = false
const bundles = await Promise.all(configs.map(cfg => build(cfg)))

bundles.forEach(({ errors, warnings, metafile }) => {
  if (metafile) {
    analyzeMetafileSync(metafile)
    const out = Object.keys(metafile.outputs).find(k => k.endsWith('.js'))
    if (out) {
      const metafilepath = resolve(out + '.metafile.json')
      writeFileSync(metafilepath, JSON.stringify(metafile))
      consola.debug(metafilepath)
    }
  }
  if (errors.length) {
    hasErrors = true
    consola.error(formatMessagesSync(errors, {
      kind: 'error',
      color: true,
      terminalWidth: process.stdout.columns,
    }))
  }
  if (warnings.length) {
    consola.warn(formatMessagesSync(warnings, {
      kind: 'warning',
      color: true,
      terminalWidth: process.stdout.columns,
    }))
  }
})

if (hasErrors) {
  consola.error('⛔️ Build failed')
  process.exit(1)
}

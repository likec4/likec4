import schema from '@likec4/config/schema.json' assert { type: 'json' }
import { type BuildOptions, analyzeMetafileSync, build, formatMessagesSync } from 'esbuild'
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill'
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { isProduction } from 'std-env'

import { resolve } from 'node:path'

const isDev = !isProduction
if (isDev) {
  console.warn('VSCODE DEVELOPMENT BUILD')
}

function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }
  console.info('Cleaning: %s', dir)
  for (const file of readdirSync(dir)) {
    rmSync(resolve(dir, file), { recursive: true, force: true })
  }
}

const vscodePreview = resolve('../vscode-preview/dist/')
if (!existsSync(vscodePreview)) {
  console.error(`"${vscodePreview}" not found`)
  process.exit(1)
}
console.info('Copy vscode preview')

emptyDir('dist')
await mkdir('dist/preview', { recursive: true })
await cp(
  vscodePreview,
  'dist/preview',
  { recursive: true },
)

await writeFile(
  './data/config.schema.json',
  JSON.stringify(
    schema,
    null,
    2,
  ),
)

console.info('Build vscode extension...')

const base = {
  metafile: isDev,
  outdir: 'dist',
  outbase: 'src',
  logLevel: isDev ? 'debug' : 'warning',
  color: true,
  bundle: true,
  treeShaking: true,
  external: ['vscode', 'esbuild', 'bundle-require', 'chokidar', 'fdir'],
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
  ],
  format: 'cjs',
  target: 'node22',
  external: ['vscode', 'esbuild', 'bundle-require', 'chokidar', 'fdir', 'std-env'],
  platform: 'node',
  conditions: [isDev ? 'development' : 'production', 'sources', 'node', 'import', 'default'],
}, {
  ...base,
  entryPoints: [
    'src/node/language-server.ts',
  ],
  format: 'cjs',
  target: 'node22',
  external: ['vscode', 'esbuild', 'bundle-require', 'chokidar', 'fdir', 'std-env'],
  platform: 'node',
  conditions: [isDev ? 'development' : 'production', 'sources', 'node', 'import', 'default'],
})

// ----------- Browser
if (isProduction) {
  configs.push({
    ...base,
    sourcemap: false,
    minifyIdentifiers: isProduction,
    entryPoints: ['src/browser/extension.ts'],
    format: 'cjs',
    target: 'es2022',
    platform: 'browser',
    plugins: [nodeModulesPolyfillPlugin()],
    conditions: ['sources', 'worker', 'browser', 'import'],
  }, {
    ...base,
    sourcemap: isDev,
    minifyIdentifiers: isProduction,
    entryPoints: ['src/browser/language-server-worker.ts'],
    format: 'iife',
    target: 'es2022',
    platform: 'browser',
    plugins: [nodeModulesPolyfillPlugin()],
    conditions: ['sources', 'worker', 'browser', 'import'],
  })
}

let hasErrors = false
const bundles = await Promise.all(configs.map(cfg => build(cfg)))

bundles.forEach(({ errors, warnings, metafile }) => {
  if (metafile) {
    analyzeMetafileSync(metafile)
    const out = Object.keys(metafile.outputs).find(k => k.endsWith('.js'))
    if (out) {
      const metafilepath = resolve(out + '.metafile.json')
      writeFileSync(metafilepath, JSON.stringify(metafile))
      console.debug(metafilepath)
    }
  }
  if (errors.length) {
    hasErrors = true
    console.error(formatMessagesSync(errors, {
      kind: 'error',
      color: true,
      terminalWidth: process.stdout.columns,
    }))
  }
  if (warnings.length) {
    console.warn(formatMessagesSync(warnings, {
      kind: 'warning',
      color: true,
      terminalWidth: process.stdout.columns,
    }))
  }
})

if (hasErrors) {
  console.error('⛔️ Build failed')
  process.exit(1)
}

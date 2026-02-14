import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isProduction } from 'std-env'
import { defineConfig } from 'tsdown'

const isDev = !isProduction

const shared = {
  clean: true,
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
  },
  minify: isProduction,
  outputOptions: {
    keepNames: true,
  },
  external: ['vscode'],
}

export default defineConfig([
  {
    outDir: 'dist/node',
    entry: 'src/node/extension.ts',
    format: 'cjs',
    nodeProtocol: true,
    cjsDefault: true,
    inlineOnly: false,
    inputOptions: {
      resolve: {
        conditionNames: [isDev ? 'development' : 'production', 'sources', 'node', 'import', 'default'],
      },
    },
    ...shared,
    hooks: {
      async 'build:done'() {
        await copySchema()
        await copyPreview()
      },
    },
  },
  {
    outDir: 'dist/node',
    entry: [
      'src/node/language-server.ts',
      'src/node/mcp-server.ts',
    ],
    nodeProtocol: true,
    format: 'esm',
    inlineOnly: false,
    inputOptions: {
      resolve: {
        conditionNames: [isDev ? 'development' : 'production', 'sources', 'node', 'import', 'default'],
      },
    },
    ...shared,
  },
  {
    outDir: 'dist/browser',
    entry: 'src/browser/extension.ts',
    format: 'cjs',
    inlineOnly: false,
    inputOptions: {
      platform: 'browser',
      resolve: {
        conditionNames: ['production', 'sources', 'worker', 'browser', 'import'],
      },
    },
    ...shared,
    plugins: [
      nodeModulesPolyfillPlugin(),
    ],
  },
  {
    outDir: 'dist/browser',
    entry: 'src/browser/language-server-worker.ts',
    format: 'iife',
    inlineOnly: false,
    inputOptions: {
      resolve: {
        conditionNames: ['production', 'sources', 'worker', 'browser', 'import'],
      },
    },
    ...shared,
    plugins: [
      nodeModulesPolyfillPlugin(),
    ],
  },
])

async function copySchema() {
  const schema = fileURLToPath(import.meta.resolve('@likec4/config/schema.json'))
  console.info('Copy config schema: %s', schema)
  await cp(schema, './data/config.schema.json')
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

async function copyPreview() {
  const vscodePreview = resolve('../vscode-preview/dist/')
  if (!existsSync(vscodePreview)) {
    throw new Error(`vscode-preview dist not found: ${vscodePreview}`)
  }
  console.info('Copy vscode preview from %s', vscodePreview)

  emptyDir('dist/preview')
  await mkdir('dist/preview', { recursive: true })
  await cp(
    vscodePreview,
    'dist/preview',
    { recursive: true },
  )
}

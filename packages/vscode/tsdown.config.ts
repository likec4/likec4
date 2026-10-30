import nodeModulesPolyfillPlugin from '@rolldown/plugin-node-polyfills'
import { existsSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isProduction } from 'std-env'
import { defineConfig } from 'tsdown'
import { fs } from 'zx'

const isDev = !isProduction

const shared = {
  clean: true,
  env: {
    NODE_ENV: isProduction ? 'production' : 'development',
  },
  minify: isProduction,
  outputOptions: {
    keepNames: true,
  },
  dts: false,
  deps: {
    neverBundle: ['vscode'],
  },
}

export default defineConfig([
  {
    ...shared,
    outDir: 'dist/node',
    entry: 'src/node/extension.ts',
    format: 'cjs',
    nodeProtocol: true,
    target: false,
    sourcemap: isDev,
    inputOptions: {
      resolve: {
        conditionNames: ['sources', 'node', 'import', 'default'],
      },
    },
  },
  {
    ...shared,
    outDir: 'dist/node',
    entry: [
      'src/node/language-server.ts',
      'src/node/mcp-server.ts',
    ],
    nodeProtocol: true,
    format: 'esm',
    target: false,
    sourcemap: isDev,
    inputOptions: {
      resolve: {
        conditionNames: ['sources', 'node', 'import', 'default'],
      },
      onLog(level, log, defaultHandler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
          return // Ignore module level directive warnings
        }
        defaultHandler(level, log) // otherwise, just print the log
      },
    },
    hooks: {
      async 'build:done'() {
        await copySchema()
        await copySkills()
        await copyPreview()
        await copyMcpApp()
      },
    },
  },
  {
    ...shared,
    outDir: 'dist/browser',
    entry: 'src/browser/extension.ts',
    format: 'cjs',
    target: false,
    inputOptions: {
      platform: 'browser',
      resolve: {
        conditionNames: ['production', 'sources', 'worker', 'browser', 'import'],
      },
    },
    plugins: [
      nodeModulesPolyfillPlugin(),
    ],
  },
  {
    ...shared,
    outDir: 'dist/browser',
    entry: 'src/browser/language-server-worker.ts',
    target: false,
    format: 'iife',
    platform: 'browser',
    inputOptions: {
      resolve: {
        conditionNames: ['worker', 'browser', 'import'],
      },
    },
    plugins: [
      nodeModulesPolyfillPlugin(),
    ],
  },
])

async function copySchema() {
  const schema = fileURLToPath(import.meta.resolve('@likec4/config/schema.json', import.meta.url))
  if (!existsSync(schema)) {
    throw new Error(`config schema not found: ${schema}`)
  }
  console.info('Copy config schema: %s', schema)
  await cp(schema, './data/config.schema.json')
}

function emptyDir(dir: string) {
  console.info('Cleaning: %s', dir)
  fs.emptyDirSync(dir)
}

async function copySkills() {
  const skillDir = resolve('../../skills/likec4-dsl')
  if (!existsSync(skillDir)) {
    throw new Error(`skills dir not found: ${skillDir}`)
  }
  console.info('Copy SKILLs: %s', skillDir)
  await cp(skillDir, './data/skills/likec4-dsl', { recursive: true })
}

async function copyPreview(): Promise<void> {
  const vscodePreview = resolve('../vscode-preview/dist/')
  if (!existsSync(vscodePreview)) {
    throw new Error(`vscode-preview dist not found: ${vscodePreview}`)
  }
  console.info('Copy vscode preview from %s', vscodePreview)

  emptyDir('dist/preview')
  await cp(
    vscodePreview,
    'dist/preview',
    { recursive: true },
  )
}

async function copyMcpApp(): Promise<void> {
  const mcpApp = resolve('../mcp/dist/app')
  if (!existsSync(mcpApp)) {
    throw new Error(`mcp-app dist not found: ${mcpApp}`)
  }
  console.info('Copy mcp app from %s', mcpApp)

  emptyDir('dist/node/app')
  await cp(
    mcpApp,
    'dist/node/app',
    { recursive: true },
  )
}

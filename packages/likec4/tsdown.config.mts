import { codeSplittingGroup, defineConfig, outputOptions } from '@likec4/devops/tsdown'
import nodePolyfills from '@rolldown/plugin-node-polyfills'
import type { Rolldown } from 'tsdown'
import { existsSync, readdirSync } from 'node:fs'
import { copyFile, cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { $, fs } from 'zx'

$.verbose = true

async function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }
  console.info('Cleaning: %s', dir)
  for (const file of readdirSync(dir)) {
    await rm(resolve(dir, file), { recursive: true, force: true })
  }
}

export default defineConfig([
  {
    entry: [
      'src/vite-plugin/index.ts',
      'src/config/index.ts',
      'src/model/builder.ts',
      'src/model/index.ts',
      'src/cli/index.ts',
      'src/generators/likec4.ts',
      'src/index.ts',
    ],
    platform: 'node',
    dts: {
      build: true,
    },
    // @likec4/core is built separately (see below), share a single copy of it
    deps: {
      onlyBundle: false,
      neverBundle: [/^likec4\/core/],
    },
    plugins: [aliasCore()],
    hooks: {
      'build:done': async ({ options: { logger } }) => {
        logger.info('\n----- Copy artifacts ------\n')

        await mkdir('./config', { recursive: true })
        await copyFile('../config/schema.json', './config/schema.json')

        await copyVitePluginModules()
        logger.success('Copied vite-plugin-modules.d.ts\n')

        await copyReact()
        logger.success('Copied @likec4/react\n')

        await bundleApp()
        logger.success('Bundled likec4-spa\n')

        await copyMcpAppAssets()
        logger.success('Copied mcp-app assets\n')

        await copySkills()
        logger.success('Copied skills\n')
      },
    },
  },
  {
    entry: {
      'index': './src/vite-plugin/internal.ts',
    },
    outDir: './dist/vite-plugin/internal',
    platform: 'neutral',
    target: false,
    minify: false,
    dts: true,
    // Share a single copy of core with the main build
    deps: {
      onlyBundle: false,
      neverBundle: [/^likec4\/core/],
    },
    plugins: [aliasCore()],
  },
  {
    // Bundled @likec4/core, exposed as `likec4/core/*`.
    // Built for any platform (browser, node), same as @likec4/core itself
    entry: {
      'index': './src/core/index.ts',
      'builder': './src/core/builder.ts',
      'geometry': './src/core/geometry.ts',
      'compute-view': './src/core/compute-view.ts',
      'model': './src/core/model.ts',
      'styles': './src/core/styles.ts',
      'types': './src/core/types.ts',
      'utils': './src/core/utils.ts',
    },
    outDir: './dist/core',
    platform: 'neutral',
    target: false,
    nodeProtocol: 'strip',
    outputOptions: outputOptions({
      codeSplitting: {
        groups: [
          codeSplittingGroup(/node_modules\/mdast/, 'libs/mdast'),
          codeSplittingGroup(/node_modules\/remark/, 'libs/remark'),
        ],
      },
    }),
    plugins: [nodePolyfills()],
  },
  {
    // Bundled @likec4/layouts, exposed as `likec4/layouts`.
    // Shares the core with the other builds
    entry: {
      'index': './src/layouts/index.ts',
    },
    outDir: './dist/layouts',
    platform: 'neutral',
    target: false,
    // graphology needs `events`
    nodeProtocol: 'strip',
    minify: false,
    dts: true,
    deps: {
      onlyBundle: false,
      neverBundle: [/^likec4\/core/],
    },
    plugins: [aliasCore(), nodePolyfills()],
  },
])

/**
 * Rewrites `@likec4/core/*` to the external `likec4/core/*`, the entries of the core build.
 */
function aliasCore(): Rolldown.Plugin {
  return {
    name: 'likec4:alias-core',
    resolveId: {
      filter: { id: /^@likec4\/core(\/.*)?$/ },
      handler: (id: string) => ({ id: id.replace('@likec4/core', 'likec4/core'), external: true }),
    },
  }
}

async function copyVitePluginModules() {
  const vitePluginModulesPath = fileURLToPath(import.meta.resolve('@likec4/vite-plugin/modules'))
  if (!existsSync(vitePluginModulesPath)) {
    throw new Error(`vite-plugin modules not found: ${vitePluginModulesPath}`)
  }
  console.info('Copy vite-plugin-modules from %s', vitePluginModulesPath)
  await copyFile(vitePluginModulesPath, './vite-plugin-modules.d.ts')
}

async function copyReact() {
  const from = resolve('../react/dist/')
  if (!existsSync(from)) {
    throw new Error(`@likec4/react/dist/ not found: ${from}`)
  }
  const to = resolve('./react/')

  await emptyDir(to)
  await mkdir(to, { recursive: true })

  console.info(`Copy @likec4/react`)
  console.info(`  from: ${from}`)
  console.info(`  to: ${to}`)

  await fs.copy(from, to)
}

async function bundleApp() {
  const from = resolve('../likec4-spa/dist/')
  if (!existsSync(from)) {
    throw new Error(`likec4 spa not found: ${from}`)
  }
  const to = resolve('__app__')

  await emptyDir(to)
  await mkdir(to, { recursive: true })

  console.info(`Copy @likec4/spa`)
  console.info(`  from: ${from}`)
  console.info(`  to: ${to}`)

  await fs.copy(from, to)
}

async function copyMcpAppAssets() {
  const from = resolve('../mcp/dist/app/')
  if (!existsSync(from)) {
    throw new Error(`@likec4/mcp dist/app not found: ${from}`)
  }
  const to = resolve('./dist/app/')

  await mkdir(to, { recursive: true })

  console.info(`Copy @likec4/mcp app assets`)
  console.info(`  from: ${from}`)
  console.info(`  to: ${to}`)

  await fs.copy(from, to)
}

async function copySkills() {
  const skillDir = resolve('../../skills/likec4-dsl')
  if (!existsSync(skillDir)) {
    throw new Error(`skills dir not found: ${skillDir}`)
  }
  console.info('Copy SKILLs: %s', skillDir)
  await cp(skillDir, './skills/likec4-dsl', { recursive: true })
}

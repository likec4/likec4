import { defineConfig } from '@likec4/devops/tsdown'
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
  },
])

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

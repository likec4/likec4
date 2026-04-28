import { defineConfig } from '@likec4/devops/tsdown'
import { existsSync, readdirSync } from 'node:fs'
import { copyFile, mkdir, rm } from 'node:fs/promises'
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

export default defineConfig([{
  entry: [
    'src/vite-plugin/index.ts',
    'src/config/index.ts',
    'src/model/builder.ts',
    'src/model/index.ts',
    'src/cli/index.ts',
    'src/index.ts',
  ],
  tsconfig: 'tsconfig.cli.json',
  dts: {
    tsconfig: 'tsconfig.cli.json',
  },
  inputOptions: {
    resolve: {
      mainFields: ['module', 'main'],
      conditionNames: ['production', 'sources', 'node', 'import', 'default'],
    },
  },
  hooks: {
    'build:done': async () => {
      const vitePluginModulesPath = fileURLToPath(import.meta.resolve('@likec4/vite-plugin/modules'))
      console.info('Copy vite-plugin-modules from %s', vitePluginModulesPath)
      await copyFile(vitePluginModulesPath, './vite-plugin-modules.d.ts')
      await mkdir('./config', { recursive: true })
      await copyFile('../config/schema.json', './config/schema.json')

      await copyReact()
      await bundleApp()
    },
  },
}, {
  entry: {
    'index': './src/vite-plugin/internal.ts',
  },
  outDir: './dist/vite-plugin/internal',
  platform: 'browser',
  target: false,
  tsconfig: 'tsconfig.cli.json',
  dts: {
    tsconfig: 'tsconfig.cli.json',
  },
}])

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

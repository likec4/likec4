import { logDebug, logger } from '@/logger'
import react from '@vitejs/plugin-react-swc'
import fs from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { InlineConfig, UserConfig } from 'vite'
import { likec4Plugin } from './plugin/plugin'

import { postcss } from './postcss'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const getAppRoot = () => {
  if (fs.existsSync(join(__dirname, '../../typings-for-build/app/index.html'))) {
    // published/compiled folder of our app
    return join(__dirname, '../../typings-for-build/app')
  }
  return join(__dirname, '../../app')
}

export const viteConfig = async (viteConfig?: InlineConfig): Promise<UserConfig> => {
  const root = getAppRoot()
  if (!fs.existsSync(root)) {
    throw new Error(`app root does not exist: ${root}`)
  }
  logDebug(`app root: ${root}`)

  return Promise.resolve({
    ...viteConfig,
    configFile: false,
    root,
    envDir: process.cwd(),
    resolve: {
      alias: {
        '@likec4/core': resolve(__dirname, '../../../core/src'),
        '@likec4/diagrams': resolve(__dirname, '../../../diagrams/src'),
        '~': resolve(root, './src')
      }
    },
    css: {
      postcss: resolve(__dirname, '../../postcss.config.js')
      // postcss: postcss()
    },
    customLogger: logger,
    clearScreen: false,
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-inspector',
        'konva',
        '@react-spring/konva',
        'react-konva'
      ]
    },
    plugins: [react({}), likec4Plugin({ workspace: process.cwd() })]
  })
}

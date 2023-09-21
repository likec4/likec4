import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { InlineConfig } from 'vite'
import { debug } from './debug'
import { likeC4VitePlugin } from './vite-plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const getAppRoot = () => {
  if (fs.existsSync(join(__dirname, '../../typings-for-build/app/index.html'))) {
    // published/compiled folder of our app
    return join(__dirname, '../../typings-for-build/app')
  }
  return join(__dirname, '../app')
}

export const viteConfig = async (viteConfig?: InlineConfig): Promise<InlineConfig> => {
  const root = getAppRoot()
  debug('app root: %s', root)

  return Promise.resolve({
    ...viteConfig,
    configFile: false,
    root,
    css: {
      postcss: process.cwd()
    },
    envDir: process.cwd(),
    resolve: {
      alias: {
        '@likec4/core': resolve(__dirname, '../../../core/src'),
        '@likec4/diagrams': resolve(__dirname, '../../../diagrams/src')
      }
    },
    logLevel: 'info',
    clearScreen: false,
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-inspector']
    },
    plugins: [react(), likeC4VitePlugin()]
  })
}

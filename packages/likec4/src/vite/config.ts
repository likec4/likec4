import { logDebug, logger } from '@/logger'
import react from '@vitejs/plugin-react-swc'
import fs from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// import { createRequire } from 'module'
import type { InlineConfig, UserConfig } from 'vite'
import { likec4Plugin } from './plugin/plugin'
import { merge } from 'rambdax'
import { mkLanguageServices } from '../language-services'

// const require = createRequire(import.meta.url)

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

  const languageServices = await mkLanguageServices({
    workspaceDir: root
  })

  return await Promise.resolve(
    merge(
      {
        root,
        envDir: process.cwd(),
        resolve: {
          dedupe: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-inspector'
          ],
          alias: {
            '@likec4/core': resolve(__dirname, '../../../core/src'),
            '@likec4/diagrams': resolve(__dirname, '../../../diagrams/src'),
            '~': resolve(root, './src')
          }
        },
        build: {
          outDir: resolve(__dirname, '../../dist/app')
        },
        css: {
          postcss: resolve(__dirname, '../../postcss.config.js')
          // postcss: postcss()
        },
        customLogger: logger,
        optimizeDeps: {
          // TODO this is wrong, should be fullpartghs
          include: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-inspector',
            'konva',
            'konva/lib',
            '@react-spring/konva',
            'react-konva'
          ]
        },
        plugins: [
          react({
            plugins: [
              ['@swc-jotai/debug-label', {}],
              ['@swc-jotai/react-refresh', {}]
            ]
          }),
          likec4Plugin({ languageServices })
        ]
      },
      viteConfig
    )
  )
}

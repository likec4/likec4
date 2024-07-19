import { createLikeC4Logger } from '@/logger'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import consola from 'consola'
import fs from 'node:fs'
import { resolve } from 'node:path'
import k from 'picocolors'
import postcssPresetMantine from 'postcss-preset-mantine'
import type { InlineConfig } from 'vite'
import { shadowStyle } from 'vite-plugin-shadow-style'
import type { LikeC4ViteWebcomponentConfig } from './config-webcomponent.prod'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit } from './utils'

export async function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js'
}: LikeC4ViteWebcomponentConfig): Promise<InlineConfig> {
  const customLogger = createLikeC4Logger('c4:lib')

  const root = resolve('app')
  if (!fs.existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    customLogger,
    root,
    configFile: false,
    resolve: {
      alias: {
        'likec4/icons': resolve('../icons/src'),
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts')
      }
    },
    clearScreen: false,
    base,
    publicDir: false,
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      __USE_SHADOW_STYLE__: 'true',
      __USE_HASH_HISTORY__: 'false',
      'process.env.NODE_ENV': '"development"'
    },
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit,
      lib: {
        entry: 'webcomponent/webcomponent.tsx',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['iife'],
        name: 'LikeC4Views'
      },
      // commonjsOptions: {
      //   esmExternals: true,
      //   transformMixedEsModules: true
      // },
      rollupOptions: {
        plugins: [
          shadowStyle()
        ]
      }
    },
    plugins: [
      react({}),
      vanillaExtractPlugin({
        unstable_mode: 'transform'
      }),
      likec4Plugin({ languageServices })
    ],
    css: {
      postcss: {
        plugins: [
          postcssPresetMantine()
        ]
      }
    }
  }
}

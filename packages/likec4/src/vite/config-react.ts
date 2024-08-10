import type { LanguageServices } from '@/language-services'
import { createLikeC4Logger } from '@/logger'
import consola from '@likec4/log'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import k from 'picocolors'
import type { InlineConfig } from 'vite'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, JsBanners } from './utils'

type LikeC4ViteReactConfig = {
  languageServices: LanguageServices
  outDir: string
  filename?: string
}

export async function viteReactConfig({
  languageServices,
  outDir,
  filename = 'likec4-react.mjs'
}: LikeC4ViteReactConfig): Promise<InlineConfig> {
  consola.warn('DEVELOPMENT MODE')
  const customLogger = createLikeC4Logger('c4:react')

  const root = resolve('app')
  if (!existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    customLogger,
    root,
    publicDir: false,
    configFile: false,
    clearScreen: false,
    mode: 'production',
    resolve: {
      alias: {
        'likec4/icons': resolve('../icons'),
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts')
      }
    },
    esbuild: {
      banner: `'use client'\n\n` + JsBanners.banner,
      footer: JsBanners.footer,
      jsxDev: false,
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true,
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: true,
          verbatimModuleSyntax: true,
          jsx: 'react-jsx'
        }
      }
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: 'esbuild',
      copyPublicDir: false,
      chunkSizeWarningLimit,
      lib: {
        entry: 'react/likec4.tsx',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['es']
      },
      rollupOptions: {
        external: [
          'likec4/react',
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          /likec4\/icons\/.*/
        ],
        // https://github.com/vitejs/vite/issues/15012
        onwarn(warning, defaultHandler) {
          if (warning.code === 'SOURCEMAP_ERROR') {
            return
          }
          defaultHandler(warning)
        }
      }
    },
    plugins: [
      react(),
      likec4Plugin({ languageServices })
    ]
  }
}

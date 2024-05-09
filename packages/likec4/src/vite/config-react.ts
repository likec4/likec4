import type { LanguageServices } from '@/language-services'
import { createLikeC4Logger } from '@/logger'
import react from '@vitejs/plugin-react'
import consola from 'consola'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import k from 'picocolors'
import type { InlineConfig } from 'vite'
import { likec4Plugin } from './plugin'

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
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      treeShaking: true,
      // jsx: 'transform',
      jsxDev: false,
      // jsxImportSource: 'react',
      // jsxFactory: 'React.createElement',
      // banner: '/* eslint-disable */',
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true
    },
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext',
      copyPublicDir: false,
      chunkSizeWarningLimit: 2000,
      lib: {
        entry: 'react/likec4.tsx',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['es']
      },
      commonjsOptions: {
        esmExternals: true,
        ignoreTryCatch: 'remove',
        transformMixedEsModules: true
      },
      rollupOptions: {
        treeshake: true,
        output: {
          esModule: true,
          exports: 'named'
        },
        external: [
          'likec4/react',
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client'
        ]
      }
    },
    plugins: [
      react({}),
      likec4Plugin({ languageServices })
    ]
  }
}

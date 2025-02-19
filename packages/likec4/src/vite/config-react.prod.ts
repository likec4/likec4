import { viteAliases } from '@/vite/aliases'
import react from '@vitejs/plugin-react'
import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, JsBanners, viteAppRoot, viteLogger } from './utils'

type LikeC4ViteReactConfig = {
  languageServices: LikeC4
  outDir: string
  filename?: string
}

export async function viteReactConfig({
  languageServices,
  outDir,
  filename = 'likec4-react.mjs',
}: LikeC4ViteReactConfig): Promise<InlineConfig> {
  const customLogger = viteLogger
  const root = viteAppRoot()
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(root)}`)
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    customLogger,
    root,
    configFile: false,
    clearScreen: false,
    publicDir: false,
    mode: 'production',
    resolve: {
      conditions: ['production'],
      alias: viteAliases(),
    },
    esbuild: {
      banner: `'use client'\n` + JsBanners.banner,
      footer: JsBanners.footer,
      jsx: 'transform',
      jsxDev: false,
      jsxSideEffects: false,
      minifyIdentifiers: false,
      minifySyntax: false,
      minifyWhitespace: false,
      tsconfigRaw: {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: true,
          verbatimModuleSyntax: true,
          jsx: 'react-jsx',
        },
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: false,
      target: 'es2022',
      copyPublicDir: false,
      chunkSizeWarningLimit,
      lib: {
        entry: 'react/likec4.tsx',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['es'],
      },
      rollupOptions: {
        output: {
          compact: false,
          exports: 'named',
        },
        external: [
          'likec4/react',
          'likec4/model',
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          /likec4\/icons\/.*/,
        ],
        // https://github.com/vitejs/vite/issues/15012
        onwarn(warning, defaultHandler) {
          if (warning.code === 'SOURCEMAP_ERROR') {
            return
          }
          defaultHandler(warning)
        },
      },
    },
    plugins: [
      react({}),
      likec4Plugin({
        languageServices,
        useOverviewGraph: false,
      }),
    ],
  }
}

import react from '@vitejs/plugin-react'
import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { createLikeC4Logger } from '../logger'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, JsBanners, viteAppRoot } from './utils'

type LikeC4ViteReactConfig = {
  languageServices: LikeC4
  outDir: string
  filename?: string
}

export async function viteReactConfig({
  languageServices,
  outDir,
  filename = 'likec4-react.mjs'
}: LikeC4ViteReactConfig): Promise<InlineConfig> {
  const customLogger = createLikeC4Logger('c4:react')

  const root = viteAppRoot()
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    customLogger,
    root,
    configFile: false,
    clearScreen: false,
    publicDir: false,
    mode: 'production',
    esbuild: {
      banner: JsBanners.banner,
      footer: JsBanners.footer,
      jsx: 'transform',
      jsxDev: false,
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true,
      tsconfigRaw: {
        compilerOptions: {
          target: 'ES2020',
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
      target: 'es2020',
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
          'likec4',
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
      react({}),
      likec4Plugin({
        languageServices,
        useOverviewGraph: false
      })
    ]
  }
}

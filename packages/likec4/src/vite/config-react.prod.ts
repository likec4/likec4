import type { LanguageServices } from '@/language-services'
import { createLikeC4Logger } from '@/logger'
import react from '@vitejs/plugin-react'
import k from 'picocolors'
import type { InlineConfig } from 'vite'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, JsBanners, viteAppRoot } from './utils'

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
  const customLogger = createLikeC4Logger('c4:react')

  const root = viteAppRoot()
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    customLogger,
    root,
    configFile: false,
    clearScreen: false,
    publicDir: false,
    esbuild: {
      ...JsBanners
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
      // 100Kb
      assetsInlineLimit: 100 * 1024,
      chunkSizeWarningLimit,
      commonjsOptions: {
        ignoreTryCatch: 'remove'
      },
      lib: {
        entry: 'react/likec4.mjs',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['es']
      },
      rollupOptions: {
        treeshake: true,
        output: {
          compact: true,
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

import { viteAliases } from '@/vite/aliases'
import react from '@vitejs/plugin-react'
import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { createLikeC4Logger } from '../logger'
import { LikeC4VitePlugin } from '../vite-plugin/plugin'
import { chunkSizeWarningLimit, JsBanners, viteAppRoot } from './utils'

export type LikeC4ViteWebcomponentConfig = {
  webcomponentPrefix: string | undefined
  languageServices: LikeC4
  outDir: string
  base: string
  filename?: string
}

export async function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js',
}: LikeC4ViteWebcomponentConfig) {
  const customLogger = createLikeC4Logger(['vite', 'webcomponent'])
  const root = viteAppRoot()
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    root,
    clearScreen: false,
    base,
    configFile: false,
    publicDir: false,
    mode: 'production',
    resolve: {
      conditions: ['production'],
      alias: viteAliases(),
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
    },
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      'process.env.NODE_ENV': '"production"',
    },
    esbuild: {
      ...JsBanners,
      tsconfigRaw: {
        compilerOptions: {
          target: 'ESNext',
          jsx: 'react-jsx',
        },
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
      // 100Kb
      assetsInlineLimit: 100 * 1024,
      chunkSizeWarningLimit,
      lib: {
        entry: 'src/webcomponent.js',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['iife'],
        name: 'LikeC4Views',
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
        },
        output: {
          format: 'iife',
          hoistTransitiveImports: false,
          compact: true,
        },
      },
    },
    customLogger,
    plugins: [
      react(),
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
        useOverviewGraph: false,
      }),
    ],
  } satisfies InlineConfig
}

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { consola } from 'consola'
import { resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { shadowStyle } from 'vite-plugin-shadow-style'
import { modules } from '../src/vite/plugin'

export async function buildWebcomponentBundle(_isDev = false) {
  const root = resolve('app')
  const outDir = resolve('dist/__app__/src/lib')
  consola.start(`Building webcomponent bundle...`)
  consola.info(`root: ${root}`)
  consola.info(`outDir: ${outDir}`)
  // Static website
  await build({
    root,
    configFile: false,
    resolve: {
      dedupe: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client'
      ],
      alias: {
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts')
      }
    },
    clearScreen: false,
    mode: 'production',
    define: {
      __USE_SHADOW_STYLE__: 'true',
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      treeShaking: true,
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true
    },
    build: {
      outDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: 'esbuild',
      copyPublicDir: false,
      chunkSizeWarningLimit: 2000,
      lib: {
        entry: 'webcomponent/webcomponent.tsx',
        fileName(_format, _entryName) {
          return 'webcomponent.mjs'
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
        external: [
          'virtual:likec4',
          ...modules.map(m => m.id)
        ],
        plugins: [
          shadowStyle()
        ]
      }
    },
    css: {
      postcss: {
        plugins: [
          postcssPresetMantine()
        ]
      }
    },
    plugins: [
      react({}),
      vanillaExtractPlugin({
        identifiers: 'short'
      })
    ]
  })
}

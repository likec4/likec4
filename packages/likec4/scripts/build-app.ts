import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { consola } from 'consola'
import { resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import pkg from '../package.json' assert { type: 'json' }
import { modules } from '../src/vite/plugin'

export async function buildAppBundle() {
  const root = resolve('app')
  const outDir = resolve('dist/__app__/src')
  consola.start(`Building app bundle...\nroot: ${root}`)
  // Static website
  await build({
    root,
    resolve: {
      alias: {
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts'),
        '@likec4/diagrams': resolve('../diagrams/src/index.ts')
      }
    },
    build: {
      emptyOutDir: false,
      outDir,
      cssCodeSplit: false,
      cssMinify: false,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        ecma: 2020,
        keep_classnames: true,
        keep_fnames: true
      },
      assetsDir: '../assets',
      // 100Kb
      assetsInlineLimit: 100 * 1024,
      chunkSizeWarningLimit: 2_500_000,
      // commonjsOptions: {
      //   // esmExternals: true,
      //   // sourceMap: false
      // },
      // minify: true,
      copyPublicDir: false,
      lib: {
        entry: {
          app: 'src/app.tsx'
        },
        formats: ['es']
      },
      commonjsOptions: {
        ignoreTryCatch: 'remove'
      },
      rollupOptions: {
        external: [
          ...Object.keys(pkg.dependencies),
          'react/jsx-runtime',
          'virtual:likec4',
          ...modules.map(m => m.id)
        ]
        // output: {
        //   entryFileNames: '[name].js',
        //   assetFileNames: '[name].[ext]',
        // }
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
      react({
        jsxImportSource: 'react',
        devTarget: 'es2022'
      }),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: resolve('app/src/routeTree.gen.ts'),
        routesDirectory: resolve('app/src/routes'),
        quoteStyle: 'single'
      }),
      vanillaExtractPlugin({})
    ]
  })
  consola.success('App bundle built!')
}

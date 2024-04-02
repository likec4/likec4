import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
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
    configFile: false,
    resolve: {
      dedupe: [
        'react',
        'react-dom'
      ],
      alias: {
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts'),
        '@likec4/diagrams': resolve('../diagrams/src/index.ts')
      }
    },
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    build: {
      emptyOutDir: false,
      outDir,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        ecma: 2020,
        module: true,
        compress: true
        // keep_classnames: true,
        // keep_fnames: true,
        // sourceMap: false
      },
      // 100Kb
      assetsInlineLimit: 100 * 1024,
      chunkSizeWarningLimit: 2_500_000,
      copyPublicDir: false,
      lib: {
        entry: {
          app: 'src/app.tsx'
          //   router: 'src/router.tsx',
          //   'routes/view.$viewId.index' : 'src/routes/view.$viewId.index.tsx',
          //   'routes/view.$viewId.react-legacy.lazy' : 'src/routes/view.$viewId.react-legacy.lazy.tsx'
        },
        // fileName(format, entryName) {
        //   return `${entryName}.${format}.mjs`
        // },
        formats: ['es']
        // name: 'LikeC4',
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        // esmExternals: true,
        requireReturnsDefault: 'namespace',
        ignoreTryCatch: 'remove'
        // defaultIsModuleExports: ''
        // include: ['react', 'react-dom']
      },
      rollupOptions: {
        // output: {
        //   format: 'esm',
        //   esModule: true,
        //   sourcemap: false,
        // },
        external: [
          //   'react/jsx-runtime',
          //   'react-dom/client',
          //   'use-sync-external-store/shim/with-selector.js',
          //   'scheduler',
          //   ...Object.keys(pkg.dependencies),
          'virtual:likec4',
          ...modules.map(m => m.id)
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

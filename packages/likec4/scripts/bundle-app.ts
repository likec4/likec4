import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { consola } from 'consola'
import { resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import pkg from '../package.json' assert { type: 'json' }
import { modules } from '../src/vite/plugin'

export async function bundleApp() {
  const root = resolve('app')
  const outDir = resolve('dist/__app__/src')
  consola.start(`Bundle app...\nroot: ${root}`)
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
    esbuild: {
      treeShaking: true
    },
    build: {
      emptyOutDir: false,
      outDir,
      cssCodeSplit: false,
      cssMinify: true,
      minify: true,
      sourcemap: false,
      target: 'esnext',
      assetsInlineLimit: 500 * 1024,
      chunkSizeWarningLimit: 3_000_000,
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
        // include: [
        //   'framer-motion'
        // ],
        // transformMixedEsModules: true,
        esmExternals: true,
        // requireReturnsDefault: 'namespace',
        ignoreTryCatch: 'remove'
        // defaultIsModuleExports: ''
        // include: ['react', 'react-dom']
      },
      rollupOptions: {
        treeshake: true,
        output: {
          exports: 'named'
        },
        external: [
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
  consola.success('App bundled\n\n')
}

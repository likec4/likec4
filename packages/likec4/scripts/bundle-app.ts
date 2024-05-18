import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { consola } from 'consola'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { modules } from '../src/vite/plugin'

export async function bundleApp() {
  const root = resolve('app')
  const outDir = resolve('dist/__app__/src')
  consola.start(`Bundling App...`)
  consola.info(`root: ${root}`)
  // Static website
  await build({
    root,
    configFile: false,
    clearScreen: false,
    resolve: {
      dedupe: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        'react-dom/client',
        '@mantine/core',
        '@mantine/hooks'
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
      treeShaking: true,
      legalComments: 'none',
      minifyIdentifiers: false,
      minifyWhitespace: true,
      minifySyntax: true
    },
    build: {
      emptyOutDir: false,
      outDir,
      chunkSizeWarningLimit: 2000,
      cssCodeSplit: false,
      cssMinify: true,
      minify: 'esbuild',
      sourcemap: false,
      assetsInlineLimit: 0,
      target: 'esnext',
      lib: {
        entry: {
          main: 'src/main.tsx'
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
        transformMixedEsModules: true,
        esmExternals: true,
        // requireReturnsDefault: 'namespace',
        ignoreTryCatch: 'remove'
        // defaultIsModuleExports: ''
        // include: ['react', 'react-dom']
      },

      rollupOptions: {
        treeshake: true,
        output: {
          compact: true,
          exports: 'named'
        },
        external: [
          'virtual:likec4',
          resolve('app/src/const.js'),
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
      vanillaExtractPlugin({
        identifiers: 'short'
      })
    ]
  })

  consola.info(`copy app files to dist/__app__`)
  let indexHtml = await readFile('app/index.html', 'utf-8')
  indexHtml = indexHtml.replace('%VITE_HTML_DEV_INJECT%', '')
  await writeFile('dist/__app__/index.html', indexHtml)

  await Promise.all([
    copyFile('app/robots.txt', 'dist/__app__/robots.txt'),
    copyFile('app/favicon.ico', 'dist/__app__/favicon.ico'),
    copyFile('app/favicon.svg', 'dist/__app__/favicon.svg'),
    copyFile('app/src/const.js', 'dist/__app__/src/const.js')
  ])
}

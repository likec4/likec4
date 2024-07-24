import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import { consola } from 'consola'
import { $ } from 'execa'
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { join, resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { modules } from '../src/vite/plugin'
import { amIExecuted } from './_utils'

export async function bundleApp() {
  const cwd = process.cwd()

  consola.info(`Run tanstack-router generate`)
  await $`tsr generate`

  const root = resolve(cwd, 'app')
  const outDir = resolve(cwd, 'dist/__app__/src')
  consola.start(`Bundling App...`)
  consola.info(`root: ${root}`)

  const tsconfig = await readFile('app/tsconfig.json', 'utf-8')

  // Static website
  await build({
    root,
    configFile: false,
    clearScreen: false,
    resolve: {
      alias: {
        '@likec4/core': resolve(cwd, '../core/src/index.ts'),
        '@likec4/diagram': resolve(cwd, '../diagram/src/index.ts'),
        'react-dom/server': resolve(cwd, 'app/react/react-dom-server-mock.ts')
      }
    },
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      minifyIdentifiers: false,
      minifyWhitespace: true,
      minifySyntax: true,
      lineLimit: 150,
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: true,
          verbatimModuleSyntax: true,
          jsx: 'react-jsx'
        }
      }
    },
    build: {
      modulePreload: false,
      emptyOutDir: true,
      outDir,
      chunkSizeWarningLimit: 2000,
      cssCodeSplit: false,
      cssMinify: true,
      minify: 'esbuild',
      target: 'es2022',
      sourcemap: false,
      assetsInlineLimit: 1_000_000,
      lib: {
        entry: {
          'main': 'src/main.tsx'
        },
        formats: ['es']
      },
      commonjsOptions: {
        defaultIsModuleExports: 'auto',
        requireReturnsDefault: 'auto',
        extensions: ['.mjs', '.js'],
        transformMixedEsModules: true,
        ignoreTryCatch: 'remove'
      },
      rollupOptions: {
        // input: {
        //   main: root + '',
        //   // 'routes/index': root + '/src/routes/index.tsx',
        //   // 'routes/export.$viewId': root + '/src/routes/export.$viewId.tsx',
        //   // 'routes/embed.$viewId': root + '/src/routes/embed.$viewId.tsx',
        //   // 'routes/view.$viewId.editor': root + '/src/routes/view.$viewId.editor.tsx',
        //   // 'routes/view.$viewId.index': root + '/src/routes/view.$viewId.index.tsx',
        //   // 'router': root + '/src/router.tsx',
        //   // 'routeTree.gen': root + '/src/routeTree.gen.ts',
        //   // 'components/sidebar/Drawer': root + '/src/components/sidebar/Drawer.tsx',
        //   'components/RenderIcon': root + '/src/components/RenderIcon.tsx',
        // },
        treeshake: {
          preset: 'recommended'
          // moduleSideEffects: false,
        },
        output: {
          hoistTransitiveImports: false,
          interop: 'auto',
          format: 'esm',
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name][extname]'
        },
        external: [
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'react',
          'react-dom',
          '@nanostores/react',
          'nanostores',
          resolve(cwd, 'app/src/const.js'),
          ...modules.map(m => m.id)
        ]
      }
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          postcssPresetMantine()
        ]
      }
    },
    plugins: [
      vanillaExtractPlugin({
        identifiers: 'short'
      }),
      react()
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

if (amIExecuted(import.meta.filename)) {
  consola.info('Running as script')
  await bundleApp()
}

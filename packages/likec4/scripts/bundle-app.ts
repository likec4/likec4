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
      jsxDev: false,
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
          'main': 'src/main.tsx',
          'theme': 'src/theme.ts',
          'hooks': 'src/hooks.ts',
          'routeTree.gen': 'src/routeTree.gen.ts',
          'router': 'src/router.tsx',
          'routes/__root': 'src/routes/__root.tsx',
          'routes/-view-lazy-data': 'src/routes/-view-lazy-data.ts',
          'routes/export.$viewId': 'src/routes/export.$viewId.tsx',
          'routes/embed.$viewId': 'src/routes/embed.$viewId.tsx',
          'routes/index': 'src/routes/index.tsx',
          'routes/index.css': 'src/routes/index.css.ts',
          'routes/view_viewId_.css': 'src/routes/view_viewId_.css.ts',
          'routes/view.$viewId.d2': 'src/routes/view.$viewId.d2.tsx',
          'routes/view.$viewId.dot': 'src/routes/view.$viewId.dot.tsx',
          'routes/view.$viewId.mmd': 'src/routes/view.$viewId.mmd.tsx',
          'routes/view.$viewId.editor': 'src/routes/view.$viewId.editor.tsx',
          'routes/view.$viewId.index': 'src/routes/view.$viewId.index.tsx',
          'routes/view.$viewId': 'src/routes/view.$viewId.tsx',
          'routes/view.css': 'src/routes/view.css.ts',
          'routes/webcomponent.$': 'src/routes/webcomponent.$.tsx',
          'components/sidebar/Drawer': 'src/components/sidebar/Drawer.tsx',
          'components/view-page/Header': 'src/components/view-page/Header.tsx',
          'components/RenderIcon': 'src/components/RenderIcon.tsx',
          'components/NotFound': 'src/components/NotFound.tsx',
          'components/CopyToClipboard': 'src/components/CopyToClipboard.tsx',
          'components/ColorSchemeToggle': 'src/components/ColorSchemeToggle.tsx'
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
        treeshake: {
          preset: 'smallest'
          // moduleSideEffects: false,
        },
        output: {
          hoistTransitiveImports: false,
          interop: 'auto',
          format: 'esm',
          entryFileNames: '[name].js',
          assetFileNames: '[name][extname]',
          chunkFileNames: 'chunks/[name]-[hash].js',
          manualChunks: (id) => {
            if (id.includes('@mantine')) {
              return 'mantine'
            }
            if (id.includes('@tanstack')) {
              return 'tanstack-router'
            }
            if (id.includes('@likec4') || id.includes('@xyflow')) {
              return 'likec4'
            }
            return null
          }
        },
        external: [
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'react',
          'react-dom',
          '@nanostores/react',
          'nanostores',
          '@emotion/is-prop-valid', // dev-only import from framer-motion
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

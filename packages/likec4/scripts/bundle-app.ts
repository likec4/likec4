import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import autoprefixer from 'autoprefixer'
import { consola } from 'consola'
import { $ } from 'execa'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { modules } from '../src/vite/plugin'
import { amIExecuted } from './_utils'

export async function bundleApp() {
  const cwd = process.cwd()

  consola.info(`Run tanstack-router generate`)
  await $`tsr generate`

  const root = resolve(cwd, 'app')
  const outDir = resolve(cwd, '__app__/src')
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
        '@likec4/core/types': resolve(cwd, '../core/src/types'),
        '@likec4/core': resolve(cwd, '../core/src'),
        '@likec4/diagram': resolve(cwd, '../diagram/src'),
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
      cssMinify: 'esbuild',
      minify: 'esbuild',
      target: 'esnext',
      sourcemap: false,
      assetsInlineLimit: 1_000_000,
      lib: {
        entry: {
          'main': 'src/main.tsx',
          // 'lazy-data': 'src/routes/-view-lazy-data.ts',
          'icons': 'src/components/RenderIcon.tsx'
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
          preset: 'safest'
        },
        output: {
          // hoistTransitiveImports: false,
          interop: 'auto',
          format: 'esm',
          entryFileNames: '[name].js',
          assetFileNames: '[name][extname]',
          chunkFileNames: 'chunks/[name]-[hash].js',
          manualChunks: (id) => {
            if (id.includes('.css')) {
              return null
            }
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
          'likec4/react',
          '@emotion/is-prop-valid', // dev-only import from framer-motion
          resolve(cwd, 'app/src/const.js'),
          ...modules.map(m => m.id)
        ]
      }
    },
    css: {
      modules: false,
      postcss: {
        plugins: [
          postcssPresetMantine(),
          autoprefixer()
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

  consola.info(`copy app files to __app__`)
  let indexHtml = await readFile('app/index.html', 'utf-8')
  indexHtml = indexHtml.replace('%VITE_HTML_DEV_INJECT%', '')
  await writeFile('__app__/index.html', indexHtml)
  await mkdir('__app__/react', { recursive: true })
  await Promise.all([
    copyFile('app/robots.txt', '__app__/robots.txt'),
    copyFile('app/favicon.ico', '__app__/favicon.ico'),
    copyFile('app/favicon.svg', '__app__/favicon.svg'),
    copyFile('app/src/const.js', '__app__/src/const.js'),
    copyFile('app/react/likec4.tsx', '__app__/react/likec4.tsx')
  ])
}

if (amIExecuted(import.meta.filename)) {
  consola.info('Running as script')
  await bundleApp()
}

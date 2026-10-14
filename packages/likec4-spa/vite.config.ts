import { codeSplittingGroup, nodeModulesCodeSplitting } from '@likec4/devops/tsdown'
import postcssPanda from '@pandacss/dev/postcss'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { $, fs } from 'zx'
import packageJson from './package.json' with { type: 'json' }

$.quiet = false
$.verbose = true
$.preferLocal = true
$.env = {
  ...$.env,
  NODE_ENV: 'production',
}

const externals = Object
  .keys({
    ...packageJson.dependencies,
  })

export default defineConfig({
  mode: 'production',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  css: {
    transformer: 'postcss',
    postcss: {
      plugins: [
        postcssPanda() as any,
      ],
    },
  },
  resolve: {
    mainFields: ['module', 'main'],
    conditions: ['sources', 'module', 'import', 'default'],
    alias: {
      '@likec4/styles': resolve('styled-system'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'src',
    minify: false,
    target: 'esnext',
    assetsInlineLimit: 10_000_000,
    // cssMinify: 'esbuild',
    cssCodeSplit: true,
    lib: {
      entry: {
        'src/main': 'src/main.tsx',
        'src/aichat/index': 'src/aichat/index.tsx',
        'codegen/react': 'codegen/react.tsx',
        'codegen/webcomponent': 'codegen/webcomponent.tsx',
        'src/style': 'src/style.css',
        'src/fonts': 'src/fonts.css',
      },
      formats: ['es'],
    },
    rolldownOptions: {
      platform: 'neutral',
      checks: {
        bundlerTimings: false,
      },
      treeshake: {
        moduleSideEffects: 'no-external',
      },
      output: {
        keepNames: true,
        entryFileNames: '[name].mjs',
        chunkFileNames: 'src/chunks/[name].mjs',
        assetFileNames: '[name].[ext]',
        codeSplitting: {
          groups: [
            codeSplittingGroup(/styled-system/, 'styled-system', { priority: 12, minShareCount: 1 }),
            codeSplittingGroup(/node_modules\/d3/, 'libs/d3', { priority: 11 }),
            codeSplittingGroup(/node_modules\/@floating-ui/, 'libs/@floating-ui', { priority: 10 }),
            codeSplittingGroup(/node_modules\/@mantine/, 'libs/@mantine', { priority: 9 }),
            codeSplittingGroup(/node_modules\/@tanstack\/ai/, 'libs/@tanstack-ai', { priority: 8 }),
            codeSplittingGroup(/node_modules\/@tanstack/, 'libs/@tanstack', { priority: 7 }),
            codeSplittingGroup(/node_modules\/(framer-motion|motion(-dom|-utils)?)\//, 'libs/framer', { priority: 6 }),
            nodeModulesCodeSplitting({
              minShareCount: 2,
              minSize: 10 * 1024,
            }),
          ],
        },
      },
      external: [
        ...externals.map((dep) => new RegExp(`^${dep}(\\/.*)?$`)),
        /^likec4(:|\/).+$/,
      ],
    },
  },
  plugins: [
    TanStackRouterVite(),
    react({
      compiler: true,
    }),
    {
      name: 'likec4-spa',
      buildStart: {
        order: 'pre',
        handler() {
          fs.emptyDirSync('styled-system')
          $`pandacss codegen`
        },
      },
      writeBundle(opts) {
        const indexDist = resolve(opts.dir!, 'index.html')
        fs.copyFileSync('index.html', indexDist)
        this.info(`Copied index.html to ${indexDist}`)
      },
    },
  ],
})

import { codeSplittingGroup, nodeModulesCodeSplitting } from '@likec4/devops/tsdown'
import postcssPanda from '@pandacss/dev/postcss'
import babel from '@rolldown/plugin-babel'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
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
  .filter((dep) => dep !== 'use-sync-external-store')
// .filter(dep => dep !== 'react' && dep !== 'react-dom')

export default defineConfig({
  mode: 'production',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  css: {
    postcss: {
      plugins: [
        postcssPanda() as any,
      ],
    },
  },
  resolve: {
    conditions: ['sources', 'module', 'import', 'default'],
    dedupe: [
      'react',
      'react-dom',
    ],
    alias: {
      'use-sync-external-store/shim/with-selector.js': 'use-sync-external-store/shim/with-selector',
      '@likec4/styles': resolve('styled-system'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'src',
    minify: true,
    target: 'esnext',
    assetsInlineLimit: 10_000_000,
    cssMinify: 'esbuild',
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
            codeSplittingGroup(/node_modules\/d3-/, 'libs/d3', { priority: 11 }),
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
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
        /^likec4(:|\/).+$/,
      ],
    },
  },
  plugins: [
    TanStackRouterVite(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    {
      name: 'likec4-spa',
      async buildStart() {
        this.info('buildStart')
        await fs.emptyDir('styled-system')
        await $`pandacss codegen`
      },
      writeBundle(opts) {
        const indexDist = resolve(opts.dir!, 'index.html')
        fs.copyFileSync('index.html', indexDist)
        this.info(`Copied index.html to ${indexDist}`)
      },
    },
  ],
})

import { codeSplittingGroup, nodeModulesCodeSplitting } from '@likec4/devops/tsdown'
import postcssPanda from '@pandacss/dev/postcss'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { resolve } from 'path'
import { mapToObj } from 'remeda'
import { defineConfig } from 'vite'
import { $, fs, glob } from 'zx'
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
      '@likec4/diagram/custom': 'likec4/react',
      '@likec4/diagram': 'likec4/react',
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
        'src/hooks': 'src/hooks.ts',
        'src/router': 'src/router.tsx',
        'src/routeTree.gen': 'src/routeTree.gen.ts',
        'src/aichat/index': 'src/aichat/index.tsx',
        'codegen/react': 'codegen/react.tsx',
        'codegen/webcomponent': 'codegen/webcomponent.tsx',
        'src/style': 'src/style.css',
        'src/fonts': 'src/fonts.css',
        ...mapToObj(
          glob.sync([
            'src/routes/**/*.{ts,tsx}',
            'src/pages/*.{ts,tsx}',
            'src/components/**/*.{ts,tsx}',
            'src/components/**/*.{ts,tsx}',
            'src/context/**/*.{ts,tsx}',
            '!**/*.spec.{ts,tsx}',
          ]),
          (file) => [file.replace(/\.tsx?$/, ''), file],
        ),
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
            codeSplittingGroup(/html-to-image/, 'libs/html-to-image', { priority: 11, minShareCount: 1 }),
            codeSplittingGroup(/node_modules\/@tanstack\/ai/, 'libs/@tanstack-ai', { priority: 10 }),
            codeSplittingGroup(/node_modules\/@tanstack/, 'libs/@tanstack', { priority: 9 }),
            nodeModulesCodeSplitting(),
          ],
        },
      },
      external: [
        ...externals.map((dep) => new RegExp(`^${dep}(\\/.*)?$`)),
        'likec4/react',
        /^likec4(:|\/).+$/,
      ],
    },
  },
  plugins: [
    tanstackRouter(),
    react({
      compiler: true,
      exclude: [/\.d\.[cm]?ts$/],
    }),
    {
      name: 'likec4-spa',
      buildStart: {
        order: 'pre',
        handler() {
          this.info('Generating Panda CSS files...')
          execSync('pnpm pandacss codegen', {
            stdio: 'inherit',
            env: {
              ...process.env,
              NODE_ENV: 'production',
            },
            cwd: process.cwd(),
          })
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

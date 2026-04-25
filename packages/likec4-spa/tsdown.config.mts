import { outputOptions } from '@likec4/devops/tsdown'
import postcssPanda from '@pandacss/dev/postcss'
import pluginBabel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { esmExternalRequirePlugin } from 'rolldown/plugins'
import { defineConfig } from 'tsdown'
import { build as viteBuild } from 'vite'
import { $ } from 'zx'

$.quiet = false
$.verbose = true
$.preferLocal = true
$.env = {
  ...$.env,
  NODE_ENV: 'production',
}

export default defineConfig([{
  entry: [
    'src/main.tsx',
    'src/routeTree.gen.ts',
    'src/routes/**/*.tsx',
    'src/pages/*.tsx',
    '!**/*.d.ts',
    '!**/*.spec.{ts,tsx}',
  ],
  root: '.',
  env: {
    'NODE_ENV': 'production',
  },
  copy: [
    'index.html',
    'public/*',
  ],
  plugins: [
    pluginBabel({
      presets: [reactCompilerPreset()],
    }),
    esmExternalRequirePlugin({
      external: ['react', 'react-dom'],
    }),
  ],
  outDir: 'dist',
  format: 'esm',
  clean: true,
  platform: 'browser',
  minify: true,
  cjsDefault: false,
  outputOptions: outputOptions({
    polyfillRequire: false,
    codeSplitting: {
      groups: [
        {
          name: 'styled-system',
          test: /styled-system/,
          priority: 5,
        },
      ],
    },
  }),
  dts: false,
  tsconfig: 'tsconfig.src.json',
  deps: {
    neverBundle: [
      '@emotion/is-prop-valid',
      'likec4/model',
      'likec4/react',
      /@likec4\/core.*/,
      /likec4\/vite-plugin.*/,
      /likec4:/,
    ],
  },
  inputOptions: {
    resolve: {
      conditionNames: ['sources', 'import', 'default'],
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        'react-dom/server': resolve('./src/react-dom-server-mock.ts'),
      },
    },
  },
  hooks: {
    'build:prepare': async () => {
      await $`tsr generate`
    },
    'build:done': async () => {
      await viteBuild({
        configFile: false,
        css: {
          postcss: {
            plugins: [
              postcssPanda() as any,
            ],
          },
        },
        build: {
          outDir: 'dist/src',
          copyPublicDir: false,
          emptyOutDir: false,
          cssCodeSplit: true,
          cssMinify: true,
          lib: {
            entry: 'src/style.css',
            formats: ['es'],
          },
          rolldownOptions: {
            input: {
              'style.css': 'src/style.css',
              'fonts.css': 'src/fonts.css',
            },
          },
        },
      })
    },
  },
}, {
  entry: 'codegen/*.tsx',
  outDir: 'dist/codegen',
  format: 'esm',
  fixedExtension: true,
  platform: 'browser',
  minify: false,
  dts: false,
  deps: {
    neverBundle: [
      'likec4/model',
      'likec4/react',
      /@likec4\/core.*/,
      /likec4\/vite-plugin.*/,
      /likec4:/,
    ],
  },
}])

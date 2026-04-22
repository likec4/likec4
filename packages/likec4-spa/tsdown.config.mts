import pluginBabel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { esmExternalRequirePlugin } from 'rolldown/plugins'
import { defineConfig } from 'tsdown'
import { $ } from 'zx'

$.quiet = false
$.preferLocal = true
$.env = {
  ...$.env,
  NODE_ENV: 'production',
}

export default defineConfig({
  entry: [
    'src/main.tsx',
    'src/routes/**/*.tsx',
    'src/pages/**/*.tsx',
    '!**/*.d.ts',
    '!**/*.spec.{ts,tsx}',
  ],
  fixedExtension: true,
  root: '.',
  env: {
    'NODE_ENV': 'production',
  },
  copy: [
    'index.html',
    'public/*',
  ],
  plugins: [
    esmExternalRequirePlugin({
      external: ['react', 'react-dom', 'react-compiler-runtime'],
    }),
    pluginBabel({
      presets: [reactCompilerPreset({
        target: '18',
      })],
    }),
  ],
  outDir: 'dist',
  format: 'esm',
  clean: true,
  platform: 'browser',
  minify: true,
  outputOptions: {
    keepNames: true,
    polyfillRequire: false,
    codeSplitting: {
      includeDependenciesRecursively: true,
      minShareCount: 2,
      groups: [
        {
          name: 'icons',
          test: '@tabler',
        },
        {
          name: 'likec4-styles',
          test: /(pandacss|styled-system)/,
        },
        {
          name: 'd3',
          test: /d3-/,
        },
        {
          name: 'mantine',
          test: '@mantine/',
        },
      ],
    },
    chunkFileNames: 'chunks/[name]-[hash].mjs',
  },
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
    },
  },
  hooks: {
    'build:done': async () => {
      await $`vite build --mode styles`
    },
  },
})

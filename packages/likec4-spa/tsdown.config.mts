import { outputOptions } from '@likec4/devops/tsdown'
import postcssPanda from '@pandacss/dev/postcss'
import pluginBabel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'tsdown'
import { build as viteBuild } from 'vite'
import { $ } from 'zx'
import packageJson from './package.json' with { type: 'json' }

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
    'src/pages/*.tsx',
    'src/aichat/index.tsx',
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
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    pluginBabel({
      presets: [reactCompilerPreset({
        target: '18',
      })],
    }),
  ],
  outDir: 'dist',
  clean: true,
  platform: 'browser',
  minify: true,
  outputOptions: outputOptions({
    keepNames: false,
  }),
  dts: false,
  tsconfig: 'tsconfig.src.json',
  deps: {
    alwaysBundle: [
      '@likec4/vite-plugin/ai/tools',
    ],
    neverBundle: [
      ...Object.keys(packageJson.dependencies || {}).map((dep) => new RegExp(`^${dep}(/.*)?$`)),
      '@emotion/is-prop-valid',
      /likec4:/,
    ],
  },
  hooks: {
    'build:prepare': async () => {
      await $`tsr generate`
    },
    'build:done': async () => {
      await buildStyles()
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
      /likec4:/,
    ],
  },
}])

async function buildStyles() {
  await viteBuild({
    configFile: false,
    css: {
      postcss: {
        plugins: [postcssPanda as any],
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
}

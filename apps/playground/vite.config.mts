import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { difference } from 'remeda'
import { type AliasOptions, type UserConfig, defineConfig } from 'vite'
import tsconfigpaths from 'vite-tsconfig-paths'
import packageJson from './package.json' with { type: 'json' }
import tanStackRouterViteCfg from './tsr.config.json' with { type: 'json' }

const alias = {
  '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
  '@likec4/diagram': resolve('../../packages/diagram/src'),
} satisfies AliasOptions

function devconfig(): UserConfig {
  return {
    resolve: {
      conditions: ['sources'],
      alias,
      dedupe: ['vscode'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        '@likec4/icons/all',
        'langium/lsp',
        'langium',
        '@codingame/monaco-vscode-api/vscode/src/vs/editor/common/services/editorSimpleWorker',
        '@codingame/monaco-vscode-api/workers/editor.worker',
        '@codingame/monaco-vscode-textmate-service-override/worker',
        '@codingame/monaco-vscode-api',
        '@codingame/monaco-vscode-editor-api',
        'vscode-textmate',
        'vscode-oniguruma',
        'vscode',
        'vscode-uri',
        '@hpcc-js/wasm-graphviz',
        'vscode-languageserver/browser',
        'vscode-languageclient',
        'vscode-languageserver-types',
        'vscode-languageserver',
        '@tabler/icons-react',
        'framer-motion',
        'framer-motion/dom',
      ],
      esbuildOptions: {
        plugins: [
          importMetaUrlPlugin as any,
        ],
      },
    },
    esbuild: {
      jsxDev: true,
    },
    worker: {
      format: 'es',
    },
    plugins: [
      vanillaExtractPlugin(),
      tsconfigpaths(),
      react(),
      TanStackRouterVite({
        ...tanStackRouterViteCfg,
        quoteStyle: 'single',
      }),
    ],
  }
}

function prebuild(): UserConfig {
  return {
    define: {
      'process.env.NODE_ENV': '\'production\'',
    },
    resolve: {
      conditions: ['sources'],
      alias,
      dedupe: ['vscode'],
    },
    mode: 'production',
    esbuild: {
      jsxDev: false,
    },
    build: {
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: false,
      minify: false,
      outDir: resolve('prebuild'),
      target: 'esnext',
      lib: {
        entry: 'src/main.tsx',
        formats: ['es'],
        fileName(format, entryName) {
          return `${entryName}.mjs`
        },
      },
      rollupOptions: {
        input: ['src/main.tsx'],
        external: difference([
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.devDependencies || {}),
          /@codingame/,
          /framer-motion/,
          /motion-dom/,
          /motion-utils/,
          /monaco-languageclient/,
          /@likec4\/language-server\/browser/,
          /@likec4\/icons/,
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'react-dom/server',
        ], [
          '@tabler/icons-react',
          '@likec4/diagram',
        ]),
        treeshake: {
          preset: 'recommended',
        },
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
    },
    plugins: [
      vanillaExtractPlugin({}),
      tsconfigpaths(),
      react(),
      TanStackRouterVite({
        ...tanStackRouterViteCfg,
        quoteStyle: 'single',
      }),
    ],
  }
}

function build(): UserConfig {
  return {
    define: {
      'process.env.NODE_ENV': '\'production\'',
    },
    resolve: {
      conditions: ['production', 'browser', 'sources'],
      alias: {
        '/src/style.css': resolve('prebuild/playground.css'),
        '/src/main': resolve('prebuild/main.mjs'),
      },
      dedupe: ['vscode'],
    },
    mode: 'production',
    esbuild: {
      jsxDev: false,
    },
    build: {
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      minify: true,
      // minify: 'terser',
    },
    worker: {
      format: 'es',
    },
    plugins: [
      tsconfigpaths(),
      react(),
    ],
  }
}

export default defineConfig((env) => {
  if (env.command === 'build') {
    if (env.mode === 'prebuild') {
      return prebuild()
    } else {
      return build()
    }
  }
  return devconfig()
})

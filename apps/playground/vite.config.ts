import { cloudflare } from '@cloudflare/vite-plugin'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'
import pandaCss from '@likec4/styles/postcss'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { type AliasOptions, defineConfig } from 'vite'
import tsconfigpaths from 'vite-tsconfig-paths'
import tanStackRouterViteCfg from './tsr.config.json' with { type: 'json' }

const alias = {
  '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
} satisfies AliasOptions

export default defineConfig(({ command }) => ({
  resolve: {
    alias,
    conditions: ['sources'],
    dedupe: ['vscode'],
  },
  optimizeDeps: {
    include: [
      '@likec4/icons/all',
      '@hpcc-js/wasm-graphviz',
      '@codingame/monaco-vscode-editor-service-override',
      'langium/lsp',
      'langium',
      'vscode-languageserver/browser',
      'vscode-languageclient/browser',
      'vscode-languageclient',
      'vscode-languageserver-types',
      'vscode-languageserver',
      'vscode-textmate',
      'vscode-oniguruma',
      'vscode-jsonrpc',
      'vscode-uri',
    ],
    holdUntilCrawlEnd: false,
    esbuildOptions: {
      plugins: [
        importMetaUrlPlugin as any,
      ],
    },
  },
  css: {
    postcss: {
      plugins: [pandaCss()],
    },
  },
  esbuild: {
    jsxDev: command !== 'build',
  },
  worker: {
    format: 'es',
  },
  plugins: [
    tsconfigpaths(),
    TanStackRouterVite(tanStackRouterViteCfg),
    react(),
    cloudflare({
      persistState: true,
    }),
  ],
}))

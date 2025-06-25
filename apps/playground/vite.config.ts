import { cloudflare } from '@cloudflare/vite-plugin'
import pandaCss from '@likec4/styles/postcss'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'import-meta-resolve'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import url from 'url'
import { type AliasOptions, defineConfig } from 'vite'
import tsconfigpaths from 'vite-tsconfig-paths'
import tanStackRouterViteCfg from './tsr.config.json' with { type: 'json' }

const alias = {
  '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
  // '@likec4/core/compute-view/relationships': path.resolve(
  //   __dirname,
  //   '../../packages/core/src/compute-view/relationships-view/index.ts',
  // ),
  // '@likec4/core': path.resolve(__dirname, '../../packages/core/src'),
  // '@likec4/language-server': path.resolve(__dirname, '../../packages/language-server/src'),
} satisfies AliasOptions

export default defineConfig(({ command }) => ({
  resolve: {
    alias,
    conditions: ['sources'],
    dedupe: ['vscode'],
  },
  css: {
    postcss: {
      plugins: [pandaCss()],
    },
  },
  esbuild: {
    jsxDev: command !== 'build',
    tsconfigRaw: readFileSync('./tsconfig.frontend.json', 'utf-8'),
  },
  worker: {
    format: 'es',
  },
  environments: {
    client: {
      resolve: {
        alias,
        conditions: ['sources'],
      },
      optimizeDeps: {
        include: [
          '@likec4/icons/all',
          '@hpcc-js/wasm-graphviz',
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
          plugins: [{
            // Copy-pasted from @codingame/esbuild-import-meta-url-plugin
            // But scoped to @codingame only
            name: 'import.meta.url',
            setup({ onLoad }) {
              // Help vite that bundles/move files in dev mode without touching `import.meta.url` which breaks asset urls
              onLoad({ filter: /.*@codingame.*\.js$/, namespace: 'file' }, async (args) => {
                const code = await readFile(args.path, 'utf8')
                const assetImportMetaUrlRE =
                  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/g
                let i = 0
                let newCode = ''
                for (
                  let match = assetImportMetaUrlRE.exec(code);
                  match != null;
                  match = assetImportMetaUrlRE.exec(code)
                ) {
                  newCode += code.slice(i, match.index)
                  const path = match[1]!.slice(1, -1)
                  const resolved = resolve(path, url.pathToFileURL(args.path).toString())
                  newCode += `new URL(${JSON.stringify(url.fileURLToPath(resolved))}, import.meta.url)`
                  i = assetImportMetaUrlRE.lastIndex
                }
                newCode += code.slice(i)
                return { contents: newCode }
              })
            },
          }],
        },
      },
    },
    playground: {
      resolve: {
        conditions: ['workerd', 'worker', 'sources'],
      },
    },
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

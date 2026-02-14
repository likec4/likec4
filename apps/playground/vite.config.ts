import { cloudflare } from '@cloudflare/vite-plugin'
import pandaCss from '@likec4/styles/postcss'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve as resolveImportMeta } from 'import-meta-resolve'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import url from 'url'
import { type AliasOptions, defineConfig } from 'vite'
import tsconfigpaths from 'vite-tsconfig-paths'
import tanStackRouterViteCfg from './tsr.config.json' with { type: 'json' }

const alias = {
  '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
  'react-dom/server': resolve('./src/react-dom-server-mock.ts'),
  '@likec4/styles/': resolve('./styled-system/'),
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
          'langium/lsp',
          'langium',
          'vscode-languageserver/browser',
          'vscode-languageserver-protocol',
          'vscode-languageclient/browser',
          'vscode-languageclient',
          'vscode-languageserver-types',
          'vscode-languageserver',
          'vscode-textmate',
          'vscode-oniguruma',
          'vscode-jsonrpc',
          'vscode-uri',
          'ufo',
        ],
        holdUntilCrawlEnd: false,
        esbuildOptions: {
          plugins: [
            {
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
                    const resolved = resolveImportMeta(path, url.pathToFileURL(args.path).toString())
                    newCode += `new URL(${JSON.stringify(url.fileURLToPath(resolved))}, import.meta.url)`
                    i = assetImportMetaUrlRE.lastIndex
                  }
                  newCode += code.slice(i)
                  return { contents: newCode }
                })
              },
            },
            {
              // Strip sourceMappingURL from vscode-textmate to avoid "Could not read source map" in console
              name: 'strip-vscode-textmate-sourcemap',
              setup({ onLoad }) {
                onLoad(
                  { filter: /vscode-textmate.*[\\/]release[\\/]main\.js$/, namespace: 'file' },
                  async (args) => {
                    const code = await readFile(args.path, 'utf8')
                    const stripped = code.replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
                    return { contents: stripped, loader: 'js' }
                  },
                )
              },
            },
          ],
        },
      },
    },
    playground: {
      resolve: {
        conditions: ['workerd', 'worker', 'sources'],
      },
      build: {
        sourcemap: true,
      },
      optimizeDeps: {
        /**
         * @see https://github.com/likec4/likec4/pull/2416#issuecomment-3594491275
         */
        exclude: ['remeda'],
      },
    },
  },
  plugins: [
    tsconfigpaths({
      projects: [
        './tsconfig.frontend.json',
        './tsconfig.worker.json',
      ],
    }),
    TanStackRouterVite(tanStackRouterViteCfg),
    react(),
    cloudflare({
      persistState: true,
    }),
  ],
}))

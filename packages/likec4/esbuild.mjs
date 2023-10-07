import { build } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { cp, mkdir, rm } from 'node:fs/promises'


const watch = process.argv.includes('--watch')
const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod'
console.log(`LikeC4 build isDev=${isDev}`)

const alias = {
  // 'vscode-uri': 'vscode-uri/lib/esm/index.js',
  // 'vscode-rpc/node': 'vscode-uri/lib/browser/main.js',
  // 'vscode-rpc': 'vscode-uri/lib/browser/main.js',
  // '@likec4/core/compute-view': '../core/src/compute-view/index.ts',
  // '@likec4/core/utils': '../core/src/utils/index.ts',
  // '@likec4/core/errors': '../core/src/errors/index.ts',
  // '@likec4/core/types': '../core/src/types/index.ts',
  // '@likec4/core/colors': '../core/src/colors.ts',
  // '@likec4/core': '../core/src/index.ts',
  // '@likec4/diagrams': '../diagrams/src/index.ts',
  // '@likec4/generators': '../generators/src/index.ts',
  // '@likec4/language-server': '../language-server/src/index.ts',
  // '@likec4/layouts': '../layouts/src/index.ts'
}

/**
 * @type {import('esbuild').BuildOptions}
 */
const base = {
  metafile: isDev,
  logLevel: 'info',
  outdir: 'dist',
  outbase: 'src',
  color: true,
  bundle: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  alias,
  // alias: {
  //   ...alias
  // },
  sourcemap: true,
  sourcesContent: isDev,
  keepNames: true,
  minify: !isDev,
  treeShaking: true,
  legalComments: 'none'
}

await build({
  ...base,
  entryPoints: ['src/cli/index.ts'],
  format: 'esm',
  target: 'esnext',
  platform: 'node',
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  plugins: [
    nodeExternalsPlugin({
      devDependencies: false,
      allowList: ['@likec4/core']
    })
  ]
})

await rm('dist/__app__', { recursive: true, force: true })
await mkdir('dist/__app__')
await cp('app/', 'dist/__app__/', { recursive: true })

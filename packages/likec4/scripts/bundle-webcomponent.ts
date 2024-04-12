import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { consola } from 'consola'
import { resolve } from 'path'
import { build } from 'vite'
import { shadowStyle } from 'vite-plugin-shadow-style'
import { modules } from '../src/vite/plugin'

export async function buildWebcomponentBundle() {
  const root = resolve('app')
  const outDir = resolve('dist/__app__/src/lib')
  consola.start(`Building webcomponent bundle...`)
  consola.info(`root: ${root}`)
  consola.info(`outDir: ${outDir}`)
  // Static website
  await build({
    root,
    configFile: false,
    resolve: {
      alias: {
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts')
      }
    },
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      treeShaking: true
    },
    build: {
      outDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: true,
      copyPublicDir: false,
      target: 'esnext',
      lib: {
        entry: 'src/lib/webcomponent.tsx',
        fileName(_format, _entryName) {
          return 'webcomponent.mjs'
        },
        formats: ['es']
      },
      commonjsOptions: {
        esmExternals: true
        // extensions: ['.js', '.cjs'],
        // transformMixedEsModules: true,
        // requireReturnsDefault: 'auto'
      },
      rollupOptions: {
        treeshake: true,
        output: {
          exports: 'none'
        },
        external: [
          'virtual:likec4',
          ...modules.map(m => m.id)
        ],
        plugins: [
          shadowStyle()
        ]
      }
    },
    plugins: [
      react({}),
      vanillaExtractPlugin({})
    ]
  })
  consola.success('webcomponent bundle')
}
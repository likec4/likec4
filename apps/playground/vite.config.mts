import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin as vanillaExtractEsbuildPlugin } from '@vanilla-extract/esbuild-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { type AliasOptions, defineConfig, mergeConfig, type UserConfig, type UserConfigFnObject } from 'vite'
import tanStackRouterViteCfg from './tsr.config.json' assert { 'type': 'json' }

const root = dirname(__filename)

const alias = {
  '#monaco/bootstrap': resolve('src/monaco/bootstrap.ts'),
  '#monaco/config': resolve('src/monaco/config.ts'),
} satisfies AliasOptions

const baseConfig: UserConfigFnObject = () => {
  return {
    root,
    resolve: {
      alias
    },
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      postcss: {}
    },
    build: {
      cssCodeSplit: false
    },
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        plugins: [
          importMetaUrlPlugin as any,
          vanillaExtractEsbuildPlugin({
            runtime: true
          })
        ]
      }
    },
    plugins: []
  }
}

export default defineConfig((env) => {
  switch (true) {
    // Pre-build for production
    // Workaround for incompatibility between vanilla-extract and monaco-editor
    case env.command === 'build' && env.mode === 'pre':
      return mergeConfig<UserConfig, UserConfig>(baseConfig(env), {
        define: {
          'process.env.NODE_ENV': JSON.stringify('production')
        },
        mode: 'production',
        logLevel: 'warn',
        build: {
          cssCodeSplit: false,
          cssMinify: false,
          minify: false,
          target: 'esnext',
          outDir: resolve('prebuild'),
          emptyOutDir: true,
          commonjsOptions: {
            transformMixedEsModules: true,
            esmExternals: true
          },
          rollupOptions: {
            output: {
              hoistTransitiveImports: false,
              preserveModules: true,
              preserveModulesRoot: resolve('src'),
              entryFileNames: '[name].mjs'
            },
            treeshake: {
              preset: 'recommended'
            },
            makeAbsoluteExternalsRelative: 'ifRelativeSource',
            external: [
              'react',
              'react/jsx-runtime',
              'react-dom',
              'react-dom/client',
              '@typefox/monaco-editor-react',
              'monaco-editor',
              'monaco-editor-wrapper',
              'monaco-languageclient',
              'framer-motion',
              'esm-env',
              'tslib',
              '#monaco/bootstrap',
              '#monaco/config',
              /@likec4\/(icons|layouts|language-server).*/,
              /d3-/,
              /hpcc-js/,
              /node_modules.*vscode/,
              /node_modules.*monaco/
            ]
          },
          lib: {
            entry: {
              main: 'src/main.tsx'
            },
            formats: ['es']
          }
        },
        plugins: [
          vanillaExtractPlugin({
            identifiers: 'short'
          }),
          react({
            // jsxRuntime: 'classic'
          })
        ]
      })
    case env.command === 'build':
      return mergeConfig<UserConfig, UserConfig>(baseConfig(env), {
        define: {
          'process.env.NODE_ENV': JSON.stringify('production')
        },
        mode: 'production',
        resolve: {
          alias: {
            '/src/style.css': resolve('prebuild/style.css'),
            '/src/main': resolve('prebuild/main.mjs')
          }
        },
        build: {
          copyPublicDir: true,
          rollupOptions: {
            treeshake: {
              preset: 'recommended'
            },
            output: {
              compact: true,
              manualChunks: (id) => {
                if (id.includes('hpcc-js')) {
                  return 'graphviz'
                }
                if (
                  id.includes('node_modules') && (
                    id.includes('/vscode/')
                    || id.includes('/vscode-')
                    || id.includes('/monaco')
                  )
                ) {
                  return 'monaco'
                }
              }
            }
          }
        },
        plugins: [
          react({
            // jsxRuntime: 'classic'
          })
        ]
      })
    default:
      return mergeConfig(baseConfig(env), {
        plugins: [
          vanillaExtractPlugin({}),
          TanStackRouterVite(tanStackRouterViteCfg),
          react({})
        ]
      })
  }
})

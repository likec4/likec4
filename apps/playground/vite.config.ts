import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    root: resolve('.'),
    resolve: {
      dedupe: [
        'react',
        // 'vscode',
        'react-dom',
        'react-dom/client'
      ],
      alias: {
        '@likec4/core': resolve('../../packages/core/src/index.ts'),
        '@likec4/language-server/protocol': resolve('../../packages/language-server/src/protocol.ts'),
        '@likec4/language-server/browser': resolve('../../packages/language-server/src/browser/index.ts'),
        '@likec4/language-server': resolve('../../packages/language-server/src/index.ts'),
        '@likec4/layouts': resolve('../../packages/layouts/src/index.ts'),
        '@likec4/diagram': resolve('../../packages/diagram/src/index.ts')
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          importMetaUrlPlugin
        ]
      }
    },
    build: {
      copyPublicDir: true,
      emptyOutDir: true,
      // commonjsOptions: {
      //   esmExternals: true
      // },
      cssCodeSplit: false
    },
    plugins: [
      react(),
      vanillaExtractPlugin(),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: resolve('src/routeTree.gen.ts'),
        routesDirectory: resolve('src/routes'),
        quoteStyle: 'single'
      })
    ]
  }
})

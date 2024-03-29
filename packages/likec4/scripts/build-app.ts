import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { modules } from '../src/vite/plugin'

export async function buildAppBundle(outDir = 'dist/__app__') {
  // Static website
  await build({
    configFile: false,
    mode: 'production',
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      emptyOutDir: false,
      outDir: outDir + '/src',
      cssCodeSplit: false,
      cssMinify: false,
      sourcemap: false,
      chunkSizeWarningLimit: 2_000_000,
      commonjsOptions: {
        esmExternals: true,
        sourceMap: false
      },
      target: 'esnext',
      minify: true,
      copyPublicDir: false,
      lib: {
        entry: 'app/src/app.tsx',
        fileName: 'app',
        formats: ['es']
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-dev-runtime',
          'react/jsx-runtime',
          'scheduler',
          'nanostores',
          '@nanostores/react',
          'virtual:likec4',
          ...modules.map(m => m.id)
        ]
      }
    },
    css: {
      postcss: {
        plugins: [
          postcssPresetMantine()
        ]
      },
      modules: {
        localsConvention: 'camelCase'
      }
    },
    plugins: [
      react({
        // plugins: [
        //   ['@swc-jotai/debug-label', {}],
        //   ['@swc-jotai/react-refresh', {}]
        // ]
      }),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: 'app/src/routeTree.gen.ts',
        routesDirectory: 'app/src/routes',
        quoteStyle: 'single'
      }),
      vanillaExtractPlugin({})
    ]
  })
}

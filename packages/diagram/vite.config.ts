import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    mode: 'production',
    build: {
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      minify: false,
      lib: {
        entry: 'src/index.ts',
        formats: ['es'],
        fileName(format, entryName) {
          return `${entryName}.js`
        },
      },
      rollupOptions: {
        input: ['src/index.ts'],
        external: [
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.peerDependencies || {}),
          'react/jsx-runtime',
          'react-dom/client',
          'react-dom/server',
          /zustand/,
        ],
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
      react(),
      vanillaExtractPlugin({}),
      dts({
        staticImport: true,
        compilerOptions: {
          declarationMap: false,
        },
      }),
    ],
  }
})

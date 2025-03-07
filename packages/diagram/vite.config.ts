import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  console.log('isProduction', isProduction)
  return {
    // define: {
    //   'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    // },
    resolve: {
      conditions: ['production', 'sources'],
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      },
    },
    build: {
      emptyOutDir: isProduction,
      cssCodeSplit: false,
      cssMinify: true,
      minify: false,
      lib: {
        entry: 'src/index.ts',
        formats: ['es'],
        fileName(_format, entryName) {
          return `${entryName}.js`
        },
      },
      rollupOptions: {
        input: ['src/index.ts'],
        experimentalLogSideEffects: true,
        external: [
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.peerDependencies || {}),
          /framer-motion/,
          /motion-dom/,
          /motion-utils/,
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'react-dom/server',
        ],
        treeshake: {
          preset: 'safest',
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
      ...(isProduction
        ? [
          dts({
            staticImport: true,
            compilerOptions: {
              declarationMap: false,
            },
          }),
        ]
        : []),
    ],
  }
})

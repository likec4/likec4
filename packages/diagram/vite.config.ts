import pandacss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import type { Plugin as PostcssPlugin } from 'postcss'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

export const rewriteRootSelector: PostcssPlugin = {
  postcssPlugin: 'postcss-rewrite-root',
  Once(css) {
    css.walkRules((rule) => {
      let updatedSelectors = []
      for (let val of rule.selectors) {
        if (val.trim() === ':root') {
          // console.log('rewriting :root', rule.selectors)
          updatedSelectors.push('.likec4-shadow-root')
          continue
        }
        if (val.trim() === 'body') {
          updatedSelectors.push('.likec4-shadow-root')
          continue
        }
      }
      if (updatedSelectors.length) {
        rule.selectors = updatedSelectors
      }
    })
  },
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    conditions: ['sources'],
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      'react-dom/server': resolve('src/bundle/react-dom-server-mock.ts'),
    },
  },
  css: {
    postcss: {
      plugins: [
        pandacss(),
      ],
    },
  },
  build: {
    emptyOutDir: true,
    cssCodeSplit: true,
    cssMinify: true,
    minify: false,
    target: 'esnext',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName(_format, entryName) {
        return `${entryName}.js`
      },
    },
    rollupOptions: {
      input: [
        'src/index.ts',
        'src/bundle/index.ts',
        // 'src/styles.css',
      ],
      experimentalLogSideEffects: true,
      external: [
        ...Object.keys(packageJson.dependencies || {}),
        /framer-motion/,
        /motion/,
        /motion-dom/,
        /motion-utils/,
        /@likec4\/styles/,
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
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
    dts({
      staticImport: true,
      tsconfigPath: 'tsconfig.src.json',
      insertTypesEntry: true,
      compilerOptions: {
        customConditions: [],
        noCheck: true,
        declarationMap: false,
        noImplicitAny: false,
        noImplicitOverride: false,
        noPropertyAccessFromIndexSignature: false,
      },
    }),
  ],
})

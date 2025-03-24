import pandacss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      // 'react-dom/server': resolve('src/bundle/react-dom-server-mock.ts'),
    },
  },
  mode: 'production',
  esbuild: {
    jsxDev: false,
    minifyIdentifiers: false,
    minifyWhitespace: true,
    minifySyntax: true,
  },
  build: {
    outDir: 'bundle',
    emptyOutDir: true,
    cssCodeSplit: true,
    cssMinify: true,
    target: 'esnext',
    lib: {
      entry: 'src/bundle/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      input: [
        'src/bundle/index.ts',
        'src/styles.css',
      ],
      treeshake: {
        preset: 'recommended',
      },
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'react-dom/server',
        /@likec4\/core.*/,
        '@emotion/is-prop-valid', // dev-only import from framer-motion
      ],
    },
  },
  css: {
    postcss: {
      plugins: [
        {
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
        },
        pandacss(),
      ],
    },
  },
  plugins: [
    react(),
  ],
})

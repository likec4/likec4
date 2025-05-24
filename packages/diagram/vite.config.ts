import pandacss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import type { Plugin as PostcssPlugin } from 'postcss'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

const rewriteRootSelector: PostcssPlugin = {
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

const defaultConfig = defineConfig({
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
        'src/styles.css',
        'src/styles-font.css',
        'src/styles-min.css',
        'src/styles-xyflow.css',
      ],
      experimentalLogSideEffects: true,
      external: [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
        /framer-motion/,
        /motion/,
        /motion-dom/,
        /motion-utils/,
        /@likec4\/core/,
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
    {
      name: 'ship-panda',
      async buildEnd(err) {
        this.info('shipping panda')
        spawnSync('pnpm', ['panda', 'ship', '--outfile', './panda.buildinfo.json'], {
          stdio: 'inherit',
        })
      },
    },
  ],
})

const bundleConfig = defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      'react-dom/server': resolve('src/bundle/react-dom-server-mock.ts'),
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
      treeshake: {
        preset: 'recommended',
      },
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        /@likec4\/core.*/,
        '@emotion/is-prop-valid', // dev-only import from motion
      ],
    },
  },
  css: {
    postcss: {
      plugins: [
        pandacss(),
        rewriteRootSelector,
      ],
    },
  },
  plugins: [
    react(),
  ],
})

const stylesConfig = defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: true,
    cssMinify: true,
    lib: {
      name: 'styles',
      entry: 'src/styles.css',
      formats: ['es'],
    },
    rollupOptions: {
      input: {
        styles: 'src/styles.css',
        'styles-min': 'src/styles-min.css',
        'styles-font': 'src/styles-font.css',
        'styles-xyflow': 'src/styles-xyflow.css',
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        pandacss(),
      ],
    },
  },
})

export default defineConfig(({ mode }) => {
  if (mode === 'css') {
    return stylesConfig
  }
  if (mode === 'bundle') {
    return bundleConfig
  }
  return defaultConfig
})

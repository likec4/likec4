import pandacss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { fs } from 'zx'
import packageJson from './package.json' with { type: 'json' }

const defaultConfig = defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    conditions: ['sources'],
    // Prefer .ts/.tsx over .js so build uses source (avoid CJS .js with JSX in src/)
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
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
  esbuild: {
    jsxDev: false,
    minifyIdentifiers: false,
    minifyWhitespace: true,
    minifySyntax: true,
    tsconfigRaw: readFileSync('tsconfig.src.json', 'utf-8'),
  },
  build: {
    outDir: 'dist',
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
        'src/adhoc-editor/index.ts',
        'src/custom/index.ts',
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
        /@likec4\/core.*/,
        /@likec4\/styles.*/,
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
      compilerOptions: {
        customConditions: [],
        noCheck: true,
        declarationMap: false,
      },
    }),
    {
      name: 'ship-panda',
      async closeBundle(err) {
        if (err) {
          this.warn('skipped')
          return
        }
        this.info('shipping panda')
        execSync('pnpm panda ship --outfile ./panda.buildinfo.json', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
      },
    },
    {
      name: 'move-stylesheets',
      async closeBundle(err) {
        if (err) {
          this.warn('skipped')
          return
        }
        for (const file of fs.readdirSync(resolve('dist'))) {
          if (file.endsWith('.css')) {
            const sourcePath = resolve('dist', file)
            const content = await fs.readFile(sourcePath, 'utf-8')
            if (content.includes(':where(:host')) {
              // validate result of styles build, should be ":where(:root,:host)" as
              // expected by shadowroot styles
              throw new Error(`Found ":where(:host" in ${file}, should be ":where(:root,:host)"`)
            }
            this.info(`move ${file}`)
            await fs.move(sourcePath, resolve(file), { overwrite: true })
          }
        }
      },
    },
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
  return defaultConfig
})

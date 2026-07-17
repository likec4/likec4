import postcssPanda from '@pandacss/dev/postcss'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { fs } from 'zx'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  mode: 'production',
  resolve: {
    alias: {
      '@likec4/styles': resolve('styled-system'),
    },
    // alias: [
    //   { find: /^@likec4\/styles\/(.+)$/, replacement: resolve('styled-system', '$1', 'index') },
    // ],
  },
  oxc: {
    jsx: {
      development: false,
    },
  },
  css: {
    postcss: {
      plugins: [
        postcssPanda() as any,
      ],
    },
  },
  build: {
    emptyOutDir: true,
    cssCodeSplit: true,
    cssMinify: true,
    minify: false,
    lib: {
      entry: [
        'src/index.ts',
        'src/custom/index.ts',
        'src/styles-font.css',
        'src/styles-min.css',
        'src/styles-xyflow.css',
        'src/styles.css',
      ],
      formats: ['es'],
    },
    rolldownOptions: {
      external: [
        ...Object.keys(packageJson.dependencies || {}).map((dep) => new RegExp(`^${dep}(\\/.*)?$`)),
        /framer-motion/,
        /motion/,
        /motion-dom/,
        /motion-utils/,
      ],
      output: {
        keepNames: true,
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [
    react(),
    dts({
      staticImport: true,
      compilerOptions: {
        customConditions: [],
        noCheck: true,
        declarationMap: false,
      },
    }) as any,
    {
      name: 'ship-panda',
      buildStart() {
        this.info('pandacss codegen')
        execSync('pnpm pandacss codegen --clean', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
      },
      async closeBundle(err) {
        if (err) {
          this.warn('skipped')
          return
        }
        this.info('shipping panda')
        execSync('pnpm pandacss ship --outfile ./panda.buildinfo.json', {
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

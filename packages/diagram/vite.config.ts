import postcssPanda from '@pandacss/dev/postcss'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import type * as PostCSS from 'postcss'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { fs } from 'zx'
import packageJson from './package.json' with { type: 'json' }

const rewriteRootSelector: PostCSS.AcceptedPlugin = {
  postcssPlugin: 'postcss-rewrite-root',
  Once(css) {
    css.walkRules((rule) => {
      let updated = false
      let updatedSelectors = []
      for (let val of rule.selectors) {
        let _val = val.trim()
        if (_val === ':root' || _val === 'body') {
          // console.log('rewriting :root', rule.selectors)
          updatedSelectors.push('.likec4-shadow-root')
          updated = true
          continue
        }
        updatedSelectors.push(val)
      }

      if (updated) {
        rule.selectors = updatedSelectors
      }
    })
  },
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  mode: 'production',
  resolve: {
    conditions: ['sources'],
    // Prefer .ts/.tsx over .js so build uses source (avoid CJS .js with JSX in src/)
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      'react-dom/server': resolve('./src/bundle/react-dom-server-mock.ts'),
    },
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
        rewriteRootSelector,
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
        'src/adhoc-editor/index.ts',
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
        ...Object.keys(packageJson.dependencies || {}).map((dep) => new RegExp(`^${dep}(/.*)?$`)),
        ...Object.keys(packageJson.peerDependencies || {}).map((dep) => new RegExp(`^${dep}(/.*)?$`)),
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
    dts({
      staticImport: true,
      tsconfigPath: 'tsconfig.src.json',
      compilerOptions: {
        customConditions: [],
        noCheck: true,
        declarationMap: false,
      },
    }) as any,
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

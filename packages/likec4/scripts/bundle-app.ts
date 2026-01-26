import pandacss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import spawn from 'nano-spawn'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { resolve } from 'path'
import { build } from 'vite'
import { amIExecuted } from './_utils'

export async function bundleApp() {
  const cwd = process.cwd()

  console.info('Running tsr generate')
  await spawn('tsr', ['generate'], {
    preferLocal: true,
    stdio: 'inherit',
  })

  console.info('Running panda codegen')
  await spawn('panda', ['codegen'], {
    preferLocal: true,
    stdio: 'inherit',
  })

  const root = resolve(cwd, 'app')
  const outDir = resolve(cwd, '__app__/src')
  console.info(`Bundling App...`)
  console.info(`root: ${root}`)

  const tsconfig = await readFile('app/tsconfig.json', 'utf-8')

  const externaldependencies = [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ]

  // Static website
  await build({
    root,
    configFile: false,
    clearScreen: false,
    resolve: {
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        'react-dom/server': resolve('./app/react/react-dom-server-mock.ts'),
        '@likec4/diagram': resolve('../diagram/src'),
      },
    },
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    esbuild: {
      jsxDev: false,
      minifyIdentifiers: false,
      tsconfigRaw: tsconfig,
    },
    css: {
      postcss: {
        plugins: [pandacss()],
      },
    },
    build: {
      emptyOutDir: true,
      target: 'esnext',
      outDir,
      chunkSizeWarningLimit: 2000,
      cssCodeSplit: true,
      cssMinify: true,
      minify: true,
      sourcemap: false,
      assetsInlineLimit: 2_000_000,
      lib: {
        entry: {
          'main': 'src/main.tsx',
        },
        formats: ['es'],
      },
      commonjsOptions: {
        defaultIsModuleExports: 'auto',
        requireReturnsDefault: 'auto',
        extensions: ['.mjs', '.js'],
        transformMixedEsModules: true,
        ignoreTryCatch: 'remove',
      },
      rollupOptions: {
        input: [
          './app/src/main.tsx',
          './app/src/webcomponent.tsx',
          './app/src/fonts.css',
          './app/src/style.css',
        ],
        treeshake: 'recommended',
        output: {
          chunkFileNames: '[name].js',
          manualChunks: (id) => {
            if (id.endsWith('.css')) {
              return undefined
            }
            if (id.includes('@tabler') || id.includes('diagram/src') || id.includes('styled-system')) {
              return 'likec4'
            }
            if (id.includes('app/src/routes/_single')) {
              return 'routes/single'
            }
            if (id.includes('app/src/routes/project.$')) {
              return 'routes/projects'
            }
            if (id.includes('app/src/route')) {
              return 'routes/index'
            }
            if (id.includes('node_modules')) {
              return 'vendors'
            }
            return undefined
          },
        },
        external: [
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'react',
          'react-dom',
          'likec4/model',
          'likec4/react',
          '@emotion/is-prop-valid', // dev-only import from motion
          ...externaldependencies,
          resolve(cwd, 'app/src/const.js'),
          /@likec4\/core.*/,
          /likec4:/,
        ],
      },
    },
    plugins: [
      react(),
    ],
  })

  console.info(`copy app files to __app__`)
  let indexHtml = await readFile('app/index.html', 'utf-8')
  indexHtml = indexHtml.replace('%VITE_HTML_DEV_INJECT%', '')
  await writeFile('__app__/index.html', indexHtml)
  await mkdir('__app__/react', { recursive: true })
  await Promise.all([
    copyFile('app/robots.txt', '__app__/robots.txt'),
    copyFile('app/favicon.ico', '__app__/favicon.ico'),
    copyFile('app/favicon.svg', '__app__/favicon.svg'),
    copyFile('app/src/const.js', '__app__/src/const.js'),
    copyFile('app/react/likec4.tsx', '__app__/react/likec4.tsx'),
  ])
}

if (amIExecuted(import.meta.filename)) {
  console.info('Running as script')
  await bundleApp()
}

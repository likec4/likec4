import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { isProduction } from 'std-env'
import { type BuildConfig, defineBuildConfig } from 'unbuild'

if (!isProduction) {
  console.warn('Bundling CLI in development mode')
}

const cli: BuildConfig = {
  entries: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/config/index.ts',
    'src/model/index.ts',
    'src/model/builder.ts',
    'src/vite-plugin/index.ts',
  ],
  clean: true,
  outDir: 'dist',
  stub: false,
  failOnWarn: false,
  alias: {
    '@/vite/aliases': resolve('src/vite/aliases.prod.ts'),
    '@/vite/config-app': resolve('src/vite/config-app.prod.ts'),
    '@/vite/config-react': resolve('src/vite/config-react.prod.ts'),
    '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.prod.ts'),
  },
  declaration: isProduction,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      platform: 'node',
      legalComments: 'none',
      minify: isProduction,
      minifyIdentifiers: false,
      lineLimit: 500,
    },
    output: {
      compact: isProduction,
      hoistTransitiveImports: false,
    },
    resolve: {
      exportConditions: ['node'],
    },
    dts: {
      tsconfig: 'tsconfig.cli.json',
      compilerOptions: {
        customConditions: [
          'node',
          // 'sources',
        ],
        // noCheck: true,
        // strict: false,
        // alwaysStrict: false,
        // skipLibCheck: true,
        // skipDefaultLibCheck: true,
        // exactOptionalPropertyTypes: false,
      },
    },
  },
  hooks: {
    async 'build:done'() {
      await copyFile('./src/vite-plugin/modules.d.ts', './vite-plugin-modules.d.ts')
      await mkdir('./config', { recursive: true })
      await copyFile('../config/schema.json', './config/schema.json')
    },
  },
}

const pluginInternal: BuildConfig = {
  entries: [
    'src/vite-plugin/internal.ts',
  ],
  clean: false,
  outDir: 'dist',
  stub: false,
  failOnWarn: false,
  declaration: isProduction,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      platform: 'browser',
      minify: isProduction,
    },
    output: {
      compact: isProduction,
      hoistTransitiveImports: false,
    },
    resolve: {
      browser: true,
    },
  },
}

export default defineBuildConfig([
  // reactbundle,
  cli,
  pluginInternal,
])

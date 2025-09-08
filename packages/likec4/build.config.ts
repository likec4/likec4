import { copyFile } from 'node:fs/promises'
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
    'src/vite-plugin/internal.ts',
  ],
  clean: isProduction,
  outDir: 'dist',
  stub: false,
  failOnWarn: false,
  alias: {
    '@/vite/aliases': resolve('src/vite/aliases.prod.ts'),
    '@/vite/config-app': resolve('src/vite/config-app.prod.ts'),
    '@/vite/config-react': resolve('src/vite/config-react.prod.ts'),
    '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.prod.ts'),
  },
  declaration: isProduction ? 'node16' : false,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      platform: 'node',
      target: 'node20',
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
    async 'build:before'() {
      await copyFile('./src/vite-plugin/modules.d.ts', './vite-plugin-modules.d.ts')
    },
  },
}

export default defineBuildConfig([
  // reactbundle,
  cli,
])

import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  entries: [
    'src/index.ts',
    'src/cli/index.ts'
  ],
  clean: false,
  outDir: 'dist',
  alias: {
    '@/vite/config-app': resolve('src/vite/config-app.prod.ts'),
    '@/vite/config-react': resolve('src/vite/config-react.prod.ts'),
    '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.prod.ts')
  },
  failOnWarn: false,
  declaration: true,
  rollup: {
    inlineDependencies: true,
    output: {
      compact: true,
      hoistTransitiveImports: false
    },
    commonjs: {
      exclude: [
        /\.d\.ts$/,
        /\.d\.cts$/,
        /\.d\.mts$/
      ]
    },
    dts: {
      compilerOptions: {
        noEmitOnError: false,
        strict: false,
        alwaysStrict: false,
        skipLibCheck: true,
        skipDefaultLibCheck: true
      }
    }
  }
})

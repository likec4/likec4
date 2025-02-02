import { type BuildEntry, defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

const mkdist: BuildEntry = {
  input: './src/',
  outDir: './dist/',
  builder: 'mkdist',
  ext: 'js',
  addRelativeDeclarationExtensions: false,
  declaration: true,
  globOptions: {
    ignore: [
      '**/__*/**',
      '**/*.spec.ts',
    ],
  },
}

export default defineBuildConfig({
  entries: [mkdist],
  clean: true,
  rollup: {
    esbuild: {
      minify: true,
      minifyIdentifiers: false,
      lineLimit: 500,
    },
    inlineDependencies: true,
  },
})

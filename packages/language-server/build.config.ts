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
      '**/*.langium',
      '**/__test*/**',
      '**/*.spec.ts',
    ],
  },
}

const bundled: BuildEntry = {
  input: './src/index.ts',
  name: 'bundled',
  builder: 'rollup',
  declaration: false,
}

export default defineBuildConfig({
  entries: isProduction ? [mkdist, bundled] : [mkdist],
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

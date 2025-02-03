import { type BuildEntry, defineBuildConfig } from 'unbuild'

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
  entries: [mkdist, bundled],
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

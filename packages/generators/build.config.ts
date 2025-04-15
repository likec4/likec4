import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [{
    input: './src/',
    outDir: './dist/',
    builder: 'mkdist',
    addRelativeDeclarationExtensions: false,
    ext: 'js',
    declaration: true,
    globOptions: {
      ignore: [
        '**/__*/**',
        '**/*.spec.ts',
      ],
    },
  }],
  clean: true,
  stub: false,
})

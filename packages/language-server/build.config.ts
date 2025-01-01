import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    {
      input: './src/',
      outDir: './dist/',
      builder: 'mkdist',
      ext: 'js',
      addRelativeDeclarationExtensions: false,
      globOptions: {
        ignore: [
          '**/__test*/**',
          '**/*.spec.ts',
        ],
      },
    },
  ],
  clean: true,
  declaration: true,
})

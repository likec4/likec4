import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

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
  stub: !isProduction,
  stubOptions: {
    jiti: {
      nativeModules: [
        '@dagrejs/graphlib',
      ],
    },
  },
  declaration: true,
})

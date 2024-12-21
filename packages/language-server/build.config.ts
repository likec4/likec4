import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  entries: [
    // 'src/index.ts',
    {
      input: './src/',
      outDir: './dist/',
      builder: 'mkdist',
      ext: 'js',
      addRelativeDeclarationExtensions: true,
      globOptions: {
        ignore: [
          '**/__test*/**',
          '**/*.spec.ts',
        ],
      },
    },
  ],
  clean: isProduction,
  stub: !isProduction,
  stubOptions: {
    jiti: {
      nativeModules: [
        '@dagrejs/graphlib',
      ],
    },
  },
  declaration: 'compatible',
})

import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    // 'src/index.ts',
    {
      input: './src/',
      outDir: './dist/',
      builder: 'mkdist',
      ext: 'js',
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

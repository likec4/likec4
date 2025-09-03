import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [{
    builder: 'mkdist',
    input: 'src/',
    ext: 'mjs',
    outDir: 'dist',
    globOptions: {
      ignore: [
        '**/__*/**',
        '**/*.spec.ts',
      ],
    },
  }],
  clean: true,
  stub: false,
  declaration: 'compatible',
})

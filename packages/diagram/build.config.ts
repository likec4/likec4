import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    // 'src/index.ts',
    {
      input: './src/',
      outDir: './dist/',
      builder: 'mkdist',
    },
  ],
  clean: true,
  declaration: true,
})

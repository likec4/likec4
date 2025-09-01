import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [{
    builder: 'mkdist',
    input: 'src/',
    ext: 'mjs',
    outDir: 'dist',
  }],
  clean: true,
  stub: false,
  declaration: 'compatible',
})

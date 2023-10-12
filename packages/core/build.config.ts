/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

const pattern = ['**/*.ts', '!**/*.spec.ts', '!__test__/']

// prettier-ignore
export default defineBuildConfig({
  entries: [
    {
      builder: "mkdist",
      input: "./src/",
      outDir: "./dist/cjs/",
      format: "cjs",
      declaration: true,
      ext: "js",
      pattern,
    },
    {
      builder: "mkdist",
      input: "./src/",
      outDir: "./dist/esm/",
      declaration: true,
      format: "esm",
      ext: "js",
      pattern,
    },
  ],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false,
  sourcemap: true
})

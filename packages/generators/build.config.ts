/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

const pattern = ['**/*.ts', '!**/*.spec.ts', '!__mocks__/']

// prettier-ignore
export default defineBuildConfig({
  entries: [
    {
      builder: "mkdist",
      input: "./src/",
      outDir: "./dist/",
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

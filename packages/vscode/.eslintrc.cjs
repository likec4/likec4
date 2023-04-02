module.exports = {
  root: true,
  extends: ["@likec4"],
  parserOptions: {
    tsconfigRootDir: __dirname
  },
  ignorePatterns: [
    ".turbo",
    ".eslintrc.cjs",
    "esbuild.cjs",
    "dist",
    "contrib",
  ]
}

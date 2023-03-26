module.exports = {
  root: true,
  extends: ["@likec4"],
  parserOptions: {
    tsconfigRootDir: __dirname
  },
  ignorePatterns: [
    ".turbo",
    ".eslintrc.js",
    "esbuild.js",
    "dist",
    "contrib",
    "media",
  ]
}

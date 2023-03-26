module.exports = {
  root: true,
  extends: ["@c4x"],
  parserOptions: {
    tsconfigRootDir: __dirname
  },
  ignorePatterns: [
    ".turbo",
    ".eslintrc.cjs",
    "esbuild.cjs",
    "dist"
  ]  
}

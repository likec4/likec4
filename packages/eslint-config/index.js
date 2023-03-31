/** @type {import('eslint').ESLint.Options} */
module.exports = {
  extends: [
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  plugins: [
    "@typescript-eslint",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "tsconfig.json"
  },
  ignorePatterns: [
    ".turbo",
    ".eslintrc.js",
    ".eslintrc.cjs",
    ".esbuild.js",
    ".esbuild.cjs",
    "vite.config.ts",
    "vitest.config.ts",
    "dist",
    "node_modules"
  ],
  rules: {
    "@typescript-eslint/ban-types": "error",
    "@typescript-eslint/quotes": [
      "error",
      "single"
    ],
    "@typescript-eslint/brace-style": [
      "error",
      "1tbs",
      {
        "allowSingleLine": true
      }
    ],
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/member-delimiter-style": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-inferrable-types": "warn",
    "@typescript-eslint/consistent-type-definitions": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/switch-exhaustiveness-check": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        "prefer": "type-imports"
      }
    ]
  },
  overrides: [
    {
      files: [
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/__test__/*",
        "**/__mocks__/*"
      ],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}

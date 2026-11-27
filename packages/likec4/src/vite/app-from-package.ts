import type { AppSource } from '@likec4/spa/vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { findPkgRoot, viteAppRoot } from './utils'

/**
 * Packages always resolved from the app root.
 * Files outside of it (like the file with UI customizations) get the same React as the app,
 * even when their folder has no `node_modules`.
 */
export const reactDedupe = ['react', 'react-dom']

/**
 * Aliases to the files of the installed `likec4` package, imported by the app and the generated code
 */
export function viteAliases() {
  const pkg = findPkgRoot()
  return {
    'likec4/react': resolve(pkg, 'react/index.mjs'),
    'likec4/model': resolve(pkg, 'dist/model/index.mjs'),
    'likec4/vite-plugin/internal': resolve(pkg, 'dist/vite-plugin/internal/index.mjs'),
  }
}

/**
 * The LikeC4 app from the installed `likec4` package: the build of `@likec4/spa` in `__app__`
 */
export function appFromPackage(): AppSource {
  const root = viteAppRoot()
  return {
    root,
    assetsDir: root,
    entries: {
      app: ['index.html', 'src/main.mjs', 'src/fonts.css', 'src/style.css'],
      react: 'codegen/react.mjs',
      webcomponent: 'codegen/webcomponent.mjs',
    },
    config: {
      resolve: {
        alias: viteAliases(),
        dedupe: reactDedupe,
      },
    },
    plugins: [react()],
  }
}

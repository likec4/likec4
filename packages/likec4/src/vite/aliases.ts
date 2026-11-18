import { resolve } from 'node:path'
import { findPkgRoot } from './utils'

/**
 * Packages always resolved from the app root.
 * Files outside of it (like the file with UI customizations) get the same React as the app,
 * even when their folder has no `node_modules`.
 */
export const reactDedupe = ['react', 'react-dom']

export function viteAliases() {
  const pkg = findPkgRoot()
  return {
    'likec4/react': resolve(pkg, 'react/index.mjs'),
    'likec4/model': resolve(pkg, 'dist/model/index.mjs'),
    'likec4/vite-plugin/internal': resolve(pkg, 'dist/vite-plugin/internal/index.mjs'),
  }
}

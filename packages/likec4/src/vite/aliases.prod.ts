import { resolve } from 'node:path'
import { findPkgRoot } from './utils'

export function viteAliases() {
  const pkg = findPkgRoot()
  return {
    'likec4/icons': '@likec4/icons',
    'likec4/react': resolve(pkg, 'react/index.mjs'),
    'likec4/model': resolve(pkg, 'dist/model/index.mjs'),
    'likec4/vite-plugin/internal': resolve(pkg, 'dist/vite-plugin/internal.mjs'),
  }
}

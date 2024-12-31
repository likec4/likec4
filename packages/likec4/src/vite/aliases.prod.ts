import { resolve } from 'node:path'
import { findPkgRoot } from './utils'

export function viteAliases() {
  const pkg = findPkgRoot()
  return {
    'likec4/icons': resolve(pkg, 'icons'),
    'likec4/react': resolve(pkg, 'react'),
    'likec4/model': resolve(pkg, 'dist/model'),
  }
}

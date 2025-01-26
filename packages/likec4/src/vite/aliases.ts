import { resolve } from 'node:path'
import { findPkgRoot } from './utils'

export function viteAliases() {
  const pkg = findPkgRoot()
  return {
    '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    'likec4/icons': resolve(pkg, '../icons'),
    'likec4/react': resolve(pkg, 'app/react/components'),
    'likec4/model': resolve(pkg, 'src/model'),
    // '@likec4/core/model': resolve(pkg, '../core/src/model'),
    // '@likec4/core/types': resolve(pkg, '../core/src/types'),
    // '@likec4/core': resolve(pkg, '../core/src'),
    // '@likec4/diagram': resolve(pkg, '../diagram/src'),
  }
}

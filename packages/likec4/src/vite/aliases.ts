import { resolve } from 'node:path'
import { findPkgRoot } from './utils'

export function viteAliases() {
  const pkg = findPkgRoot()
  return {
    '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    'likec4/icons': resolve(pkg, '../icons'),
    'likec4/model': resolve(pkg, './src/model'),
    '@likec4/diagram': resolve(pkg, '../diagram/src'),
    'likec4/react': resolve(pkg, '../react/src'),
    '@likec4/styles': resolve(pkg, '../../styled-system/styles/dist'),
    'react-dom/server': resolve(pkg, 'app/react/react-dom-server-mock.ts'),
  }
}

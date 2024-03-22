import { existsSync } from 'node:fs'
import { mergeDeep, pick } from 'remeda'
import clipkg from '../../../../package.json' assert { type: 'json' }

import { readFile, writeFile } from 'node:fs/promises'

const packageJson = {
  name: '@likec4/views',
  version: '0.0.1',
  type: 'module',
  module: './index.js',
  types: './index.d.ts',
  exports: {
    '.': {
      types: './index.d.ts',
      default: './index.js'
    }
  },
  dependencies: {
    '@likec4/core': clipkg.devDependencies['@likec4/core'],
    '@likec4/diagram': clipkg.devDependencies['@likec4/diagram'],
    ...pick(clipkg.dependencies, ['@mantine/core', '@mantine/hooks'])
  },
  peerDependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0'
  },
  devDependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0'
  }
}

export async function writePackageJson({
  pkgName,
  pkgJsonPath
}: {
  pkgName: string
  pkgJsonPath: string
}) {
  if (existsSync(pkgJsonPath)) {
    const pkgJsonString = await readFile(pkgJsonPath, { encoding: 'utf-8' })
    const pkgJson = JSON.parse(pkgJsonString)
    mergeDeep(packageJson, pkgJson)
  } else {
    packageJson.name = pkgName
  }
  await writeFile(pkgJsonPath, JSON.stringify(packageJson, null, 2))
  // return JSON.stringify(packageJson, null, 2)
}

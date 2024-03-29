import { existsSync } from 'node:fs'
import { mergeDeep, pick } from 'remeda'
import clipkg from '../../../../package.json' assert { type: 'json' }

import { readFile, writeFile } from 'node:fs/promises'

const packageJson = {
  name: '@likec4/views',
  private: true,
  version: '0.0.1',
  type: 'module',
  types: './index.d.ts',
  module: './index.js',
  exports: {
    '.': {
      types: './index.d.ts',
      default: './index.js'
    }
  },
  files: [
    'package.json',
    '*.js',
    '*.d.ts'
  ],
  dependencies: {
    '@likec4/diagram': clipkg.devDependencies['@likec4/diagram'],
    ...pick(clipkg.devDependencies, ['@mantine/core', '@mantine/hooks'])
  },
  peerDependencies: {
    'react': clipkg.dependencies['react'],
    'react-dom': clipkg.dependencies['react-dom']
  },
  devDependencies: {
    'react': clipkg.dependencies['react'],
    'react-dom': clipkg.dependencies['react-dom']
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

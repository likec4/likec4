import { existsSync } from 'node:fs'
import { mergeDeep, pick } from 'remeda'
import clipkg from '../../../../package.json' with { type: 'json' }

import { readFile, writeFile } from 'node:fs/promises'

const packageJson = {
  name: '@likec4/views',
  private: true,
  version: '0.0.1',
  type: 'module',
  sideEffects: false,
  exports: {
    '.': {
      types: './index.d.ts',
      default: './index.js'
    }
  },
  dependencies: {
    'likec4': clipkg.version,
    ...pick(clipkg.dependencies, [
      'react',
      'react-dom'
    ])
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

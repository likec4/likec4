import { existsSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'
import { rootLogger } from '@likec4/log'
import { packageUpSync } from 'package-up'
import { find } from 'remeda'

/** Returns the path relative to the current working directory. */
export function relativeToCwd(path: string) {
  return relative(cwd(), path)
}

const _dirname = dirname(fileURLToPath(import.meta.url))

/** Resolves the likec4 package root by walking up from current file. */
export function findPkgRoot() {
  const pkgRoot = packageUpSync({
    cwd: _dirname,
  })
  if (!pkgRoot) {
    throw new Error(`likec4 package folder not found`)
  }
  return dirname(pkgRoot)
}

/** Resolves the path to the likec4 app directory (__app__), the build of `@likec4/spa`. */
export function viteAppRoot() {
  const pkg = findPkgRoot()
  const roots = [
    resolve(pkg, '__app__'),
    resolve(_dirname, '..', '__app__'),
    resolve(_dirname, '..', '..', '__app__'),
    resolve(_dirname, '..', '..', 'dist', '__app__'),
  ]
  const root = find(roots, existsSync)
  if (!root) {
    rootLogger.error(`likec4 app root does not exist, tried:\n${roots.join('\n')}`)
    throw new Error(`likec4 app root does not exist`)
  }
  return root
}

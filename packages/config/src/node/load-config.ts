import { invariant } from '@likec4/core'
import * as fs from 'node:fs/promises'
import type { URI } from 'vscode-uri'
import { defineConfig } from '../define-config'
import { isLikeC4JsonConfig, isLikeC4NonJsonConfig } from '../filenames'
import { type LikeC4ProjectConfig, validateProjectConfig } from '../schema'

/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file, it will be bundled and required
 */
export async function loadConfig(filepath: URI): Promise<LikeC4ProjectConfig> {
  console.debug(`Loading config file: ${filepath.fsPath}`)
  if (isLikeC4JsonConfig(filepath.fsPath)) {
    const content = await fs.readFile(filepath.fsPath, 'utf-8')
    return validateProjectConfig(content)
  }
  invariant(isLikeC4NonJsonConfig(filepath.fsPath), `Invalid config file: ${filepath.fsPath}`)
  const { bundleNRequire } = await import('bundle-n-require')
  const { mod } = await bundleNRequire(filepath.fsPath, {
    interopDefault: true,
  })
  return defineConfig(mod?.default ?? mod)
}

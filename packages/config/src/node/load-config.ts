import { invariant } from '@likec4/core'
import { bundleNRequire } from 'bundle-n-require'
import * as fs from 'node:fs/promises'
import type { URI } from 'vscode-uri'
import { defineConfig } from '../define-config'
import { isLikeC4JsonConfig, isLikeC4NonJsonConfig } from '../filenames'
import { logger } from '../logger'
import { type LikeC4ProjectConfig, validateProjectConfig } from '../schema'

/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file, it will be bundled and required
 */
export async function loadConfig(filepath: URI): Promise<LikeC4ProjectConfig> {
  logger.debug`Loading config file: ${filepath.fsPath}`
  if (isLikeC4JsonConfig(filepath.fsPath)) {
    try {
      const content = await fs.readFile(filepath.fsPath, 'utf-8')
      return validateProjectConfig(content)
    } catch (err) {
      logger.error(`Failed to load json config file: ${filepath.fsPath}`, { err })
      throw err
    }
  }

  invariant(isLikeC4NonJsonConfig(filepath.fsPath), `Invalid config file: ${filepath.fsPath}`)
  try {
    const { mod } = await bundleNRequire(filepath.fsPath, {
      interopDefault: true,
    })
    return defineConfig(mod?.default ?? mod)
  } catch (err) {
    logger.error(`Failed to load config file: ${filepath.fsPath}`, { err })
    throw err
  }
}

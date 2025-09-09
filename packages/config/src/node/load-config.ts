import { invariant } from '@likec4/core'
import { bundleRequire } from 'bundle-require'
import * as fs from 'node:fs/promises'
import { dirname } from 'node:path'
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
    const cwd = dirname(filepath.fsPath)
    const { mod } = await bundleRequire({
      filepath: filepath.fsPath,
      cwd,
      esbuildOptions: {
        resolveExtensions: ['.mjs', '.js', '.ts', '.mts'],
        plugins: [{
          name: 'likec4-config',
          setup(build) {
            /**
             * Intercept @likec4/config imports
             */
            build.onResolve({ filter: /^@?likec4\/config$/ }, (args) => ({
              path: args.path,
              namespace: 'likec4-config',
            }))
            /**
             * Mock implementation, this allows to skip redundant bundling @likec4/config
             */
            build.onLoad({ filter: /.*/, namespace: 'likec4-config' }, (args) => {
              return {
                contents: `
function mockDefineConfig(x) { return x }
export {
  mockDefineConfig as defineConfig,
  mockDefineConfig as defineGenerators,
}`,
                loader: 'js',
              }
            })
          },
        }],
      },
    })
    return defineConfig(mod?.default ?? mod)
  } catch (err) {
    logger.error(`Failed to load config file: ${filepath.fsPath}`, { err })
    throw err
  }
}

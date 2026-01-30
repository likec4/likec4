import { invariant } from '@likec4/core'
import { logger, wrapError } from '@likec4/log'
import { bundleRequire } from 'bundle-require'
import { formatMessagesSync } from 'esbuild'
import JSON5 from 'json5'
import * as fs from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { isLikeC4JsonConfig, isLikeC4NonJsonConfig } from '../filenames'
import type { LikeC4ProjectConfig, VscodeURI } from '../schema'
import { validateProjectConfig } from '../schema'

/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file, it will be bundled and required
 */
export async function loadConfig(filepath: VscodeURI | string): Promise<LikeC4ProjectConfig> {
  filepath = typeof filepath === 'string' ? filepath : filepath.fsPath
  logger.getChild('config').debug`Loading config: ${filepath}`

  const folder = dirname(filepath)
  const filename = basename(filepath)
  const implicitcfg = { name: basename(folder) }

  if (isLikeC4JsonConfig(filename)) {
    const content = await fs.readFile(filepath, 'utf-8')
    let parsed
    try {
      parsed = JSON5.parse(content.trim() || '{}')
    } catch (e) {
      throw wrapError(e, `${filepath}:`)
    }
    return validateProjectConfig({
      ...implicitcfg,
      ...parsed,
    })
  }

  invariant(isLikeC4NonJsonConfig(filename), `Invalid name for config file: ${filepath}`)
  const { mod } = await bundleRequire({
    filepath,
    cwd: folder,
    esbuildOptions: {
      resolveExtensions: ['.ts', '.mts', '.cts', '.mjs', '.js', '.cjs'],
      plugins: [{
        name: 'likec4-config',
        setup(build) {
          /**
           * Intercept @likec4/config and likec4/config imports
           */
          build.onResolve({ filter: /^@?likec4\/config$/ }, (args) => ({
            path: args.path,
            namespace: 'likec4-config',
          }))
          build.onEnd((result) => {
            const messages = formatMessagesSync(result.errors, { kind: 'error' })
            for (const message of messages) {
              logger.error(message)
            }
          })
          /**
           * Mock implementation, this allows to skip redundant bundling @likec4/config
           */
          build.onLoad({ filter: /.*/, namespace: 'likec4-config' }, (_args) => {
            return {
              contents: `
// Mock implementation to allow loading config files without bundling @likec4/config
function mock(x) { return x }
export {
  mock as defineConfig,
  mock as defineGenerators,
  mock as defineStyle,
  mock as defineTheme,
  mock as defineThemeColor,
}`,
              loader: 'js',
            }
          })
        },
      }],
    },
  })
  return validateProjectConfig(Object.assign(implicitcfg, mod?.default ?? mod))
}

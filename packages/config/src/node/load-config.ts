import { invariant } from '@likec4/core'
import { bundleRequire } from 'bundle-require'
import * as fs from 'node:fs/promises'
import { dirname } from 'node:path'
import { isLikeC4JsonConfig, isLikeC4NonJsonConfig } from '../filenames'
import type { LikeC4ProjectConfig, VscodeURI } from '../schema'
import { validateProjectConfig } from '../schema'

/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file, it will be bundled and required
 */
export async function loadConfig(filepath: VscodeURI): Promise<LikeC4ProjectConfig> {
  if (isLikeC4JsonConfig(filepath.fsPath)) {
    const content = await fs.readFile(filepath.fsPath, 'utf-8')
    const parsed = JSON.parse(content)
    return validateProjectConfig(parsed)
  }

  invariant(isLikeC4NonJsonConfig(filepath.fsPath), `Invalid config file: ${filepath.fsPath}`)
  const cwd = dirname(filepath.fsPath)
  const { mod } = await bundleRequire({
    filepath: filepath.fsPath,
    cwd,
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
  return validateProjectConfig(mod?.default ?? mod)
}

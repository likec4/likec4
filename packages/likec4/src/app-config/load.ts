import { wrapError } from '@likec4/log'
import { createJiti } from 'jiti'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import z from 'zod/v4'
import { type ParsedLikeC4AppConfig, LikeC4AppConfigSchema } from './schema'

/**
 * Known filenames of the LikeC4 app config
 */
export const AppConfigFilenames = [
  'likec4.app.config.ts',
  'likec4.app.config.mts',
  'likec4.app.config.cts',
  'likec4.app.config.js',
  'likec4.app.config.mjs',
  'likec4.app.config.cjs',
] as const

/**
 * Returns the path to the app config in the first of the given directories that has one
 */
export function findAppConfig(directories: readonly string[]): string | undefined {
  for (const directory of directories) {
    for (const filename of AppConfigFilenames) {
      const file = resolve(directory, filename)
      if (existsSync(file)) {
        return file
      }
    }
  }
  return undefined
}

const identity = <T>(value: T): T => value

/**
 * The config is validated after loading, so `define*` helpers are identity functions here.
 * This also allows loading the config when `likec4` is not installed in the user's project.
 */
const configModuleMock = {
  defineAppConfig: identity,
}

/**
 * Paths in the config are relative to its file
 */
function resolvePaths(config: ParsedLikeC4AppConfig, folder: string): ParsedLikeC4AppConfig {
  const path = (value: string | undefined) => value === undefined ? undefined : resolve(folder, value)
  return {
    ...config,
    workspace: path(config.workspace),
    customization: path(config.customization),
    publicDir: path(config.publicDir),
    build: {
      ...config.build,
      outDir: path(config.build.outDir),
    },
  }
}

/**
 * Validates the app config, `source` is used in the error message
 */
export function parseAppConfig(config: unknown, source = 'app config'): ParsedLikeC4AppConfig {
  const parsed = LikeC4AppConfigSchema.safeParse(config ?? {})
  if (!parsed.success) {
    throw new Error(`Invalid ${source}:\n` + z.prettifyError(parsed.error))
  }
  return parsed.data
}

/**
 * Loads and validates the LikeC4 app config, the file is transpiled and evaluated with jiti.
 * Paths in the returned config are absolute.
 */
export async function loadAppConfig(filepath: string): Promise<ParsedLikeC4AppConfig> {
  filepath = resolve(filepath)
  const jiti = createJiti(filepath, {
    moduleCache: false,
    // Do not write transpiled sources to node_modules/.cache or tmp dir
    fsCache: false,
    virtualModules: {
      'likec4/config': configModuleMock,
    },
  })
  let mod: unknown
  try {
    mod = await jiti.import(filepath, { default: true })
  } catch (e) {
    // Syntax errors from jiti already include the file location
    throw e instanceof Error && e.message.includes(filepath) ? e : wrapError(e, `${filepath}:`)
  }
  return resolvePaths(parseAppConfig(mod, filepath), dirname(filepath))
}

import { invariant } from '@likec4/core'
import { logger, wrapError } from '@likec4/log'
import { defu } from 'defu'
import { createJiti } from 'jiti'
import JSON5 from 'json5'
import * as fs from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import { hasAtLeast, isNonNullish, last, omit } from 'remeda'
import z from 'zod/v4'
import { isLikeC4JsonConfig, isLikeC4NonJsonConfig } from '../filenames'
import type { LikeC4ProjectConfig, VscodeURI } from '../schema'
import { LikeC4ProjectJsonConfigSchema, validateProjectConfig } from '../schema'

const JsonConfigInputSchema = LikeC4ProjectJsonConfigSchema.pick({
  extends: true,
  styles: true,
}).loose()

type JsonConfigInput = z.infer<typeof JsonConfigInputSchema>

const normalizeExtends = (value: JsonConfigInput['extends']): string[] => {
  if (!value) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

const parseJsonConfig = async (filepath: string): Promise<JsonConfigInput> => {
  const content = await fs.readFile(filepath, 'utf-8')
  let parsed: unknown
  try {
    parsed = JSON5.parse(content.trim() || '{}')
  } catch (e) {
    throw wrapError(e, `${filepath}:`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${filepath}: Config must be a JSON object`)
  }
  const result = JsonConfigInputSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`${filepath}: Invalid config\n` + z.prettifyError(result.error))
  }
  return result.data
}

/**
 * Paths in `styles.customCss` are relative to the config file that lists them.
 * Rebases them on the root config folder, so they stay correct when styles of extended configs are merged.
 */
const rebaseCustomCssPaths = (config: JsonConfigInput, folder: string, rootFolder: string): JsonConfigInput => {
  const customCss = config.styles?.customCss
  if (!customCss?.paths) {
    return config
  }
  return {
    ...config,
    styles: {
      ...config.styles,
      customCss: {
        ...customCss,
        paths: customCss.paths.map(path => relative(rootFolder, resolve(folder, path))),
      },
    },
  }
}

const loadJsonConfigs = async (
  filepath: string,
  stack: string[],
  rootFolder: string,
): Promise<[...JsonConfigInput[], JsonConfigInput]> => {
  if (stack.includes(filepath)) {
    const cycleStart = stack.indexOf(filepath)
    const cycle = [...stack.slice(cycleStart), filepath].join(' -> ')
    throw new Error(`Config extends cycle detected: ${cycle}`)
  }

  const parsed = rebaseCustomCssPaths(await parseJsonConfig(filepath), dirname(filepath), rootFolder)
  const extendsPaths = normalizeExtends(parsed.extends)
  const nextStack = [...stack, filepath]

  const configs: JsonConfigInput[] = []
  for (const extendPath of extendsPaths) {
    const resolvedPath = resolve(dirname(filepath), extendPath)
    configs.push(...await loadJsonConfigs(resolvedPath, nextStack, rootFolder))
  }
  return [...configs, parsed]
}

const identity = <T>(value: T): T => value

/**
 * Mock implementation of `@likec4/config` (and `likec4/config`) for non-JSON configs.
 * Config is validated after loading, so `define*` helpers are identity functions here.
 * This also allows loading configs when these packages are not installed in the user's project.
 */
const configModuleMock = {
  defineConfig: identity,
  defineGenerators: identity,
  defineStyle: identity,
  defineTheme: identity,
  defineThemeColor: identity,
}

/**
 * Reads the files listed in `styles.customCss`, relative to the folder of the config file.
 * A file that can't be read is skipped, so that a stale path doesn't prevent the project from loading.
 */
const loadCustomCss = async (config: LikeC4ProjectConfig, folder: string): Promise<LikeC4ProjectConfig> => {
  const customCss = config.styles?.customCss
  if (!customCss?.paths?.length) {
    return config
  }
  const contents = await Promise.all(customCss.paths.map(async (path) => {
    try {
      return await fs.readFile(resolve(folder, path), 'utf-8')
    } catch (e) {
      logger.getChild('config').warn(`Failed to read styles.customCss file "${path}": ${e}`)
      return null
    }
  }))
  return {
    ...config,
    styles: {
      ...config.styles,
      customCss: {
        ...customCss,
        content: contents.filter(isNonNullish).join('\n'),
      },
    },
  }
}

/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file (JS/TS), it is transpiled and evaluated with jiti
 */
export async function loadConfig(filepath: VscodeURI | string): Promise<LikeC4ProjectConfig> {
  filepath = typeof filepath === 'string' ? filepath : filepath.fsPath
  logger.getChild('config').trace`Loading config: ${relative(cwd(), filepath)}`

  const folder = dirname(filepath)
  const filename = basename(filepath)
  const implicitcfg = { name: basename(folder) }

  if (isLikeC4JsonConfig(filename)) {
    const configs = await loadJsonConfigs(resolve(filepath), [], resolve(folder))
    invariant(hasAtLeast(configs, 1), 'Expect at least one config')
    const rootConfig = omit(last(configs), ['extends', 'styles'])
    const stylesChain = configs
      .map(config => config.styles)
      .filter(isNonNullish)

    const mergedStyles = stylesChain.length > 0
      ? defu({}, ...stylesChain.reverse())
      : undefined

    return await loadCustomCss(
      validateProjectConfig({
        ...implicitcfg,
        ...rootConfig,
        ...(mergedStyles ? { styles: mergedStyles } : {}),
      }),
      folder,
    )
  }

  invariant(isLikeC4NonJsonConfig(filename), `Invalid name for config file: ${filepath}`)
  const jiti = createJiti(filepath, {
    // Always re-evaluate the config and its imports, as the language server reloads it on change
    moduleCache: false,
    // Do not write transpiled sources to node_modules/.cache or tmp dir
    fsCache: false,
    virtualModules: {
      '@likec4/config': configModuleMock,
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
  return await loadCustomCss(validateProjectConfig(Object.assign(implicitcfg, mod)), folder)
}

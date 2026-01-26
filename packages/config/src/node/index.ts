export type {
  GeneratorFn,
  GeneratorFnContext,
  GeneratorFnParams,
  LikeC4ProjectConfig,
  LikeC4ProjectConfigInput,
  LikeC4ProjectJsonConfig,
  LocateResult,
  ManualLayoutsConfigSchema,
} from '../schema'

export type {
  IncludeConfig,
} from '../schema.include'

export type {
  LikeC4StylesConfig,
  LikeC4StylesConfigInput,
} from '../schema.theme'

export { validateProjectConfig } from '../schema'

export { normalizeIncludeConfig, validateIncludePaths } from '../schema.include'

export {
  ConfigFilenames,
  isLikeC4Config,
  isLikeC4JsonConfig,
  isLikeC4NonJsonConfig,
} from '../filenames'

export {
  defineConfig,
  defineGenerators,
  defineStyle,
  defineTheme,
  defineThemeColor,
} from '../define-config'

export { loadConfig } from './load-config'

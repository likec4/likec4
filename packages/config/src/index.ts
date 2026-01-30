export type {
  GeneratorFn,
  GeneratorFnContext,
  GeneratorFnParams,
  LikeC4ProjectConfig,
  LikeC4ProjectConfigInput,
  LikeC4ProjectJsonConfig,
  LocateResult,
} from './schema'

export {
  LikeC4ProjectConfigOps,
} from './schema'

export type {
  IncludeConfig,
} from './schema.include'

export type {
  LikeC4ConfigThemeInput,
  LikeC4StylesConfig,
  LikeC4StylesConfigInput,
  ThemeColorValuesInput,
} from './schema.theme'

export {
  ConfigFilenames,
  isLikeC4Config,
  isLikeC4JsonConfig,
  isLikeC4NonJsonConfig,
} from './filenames'

export {
  defineConfig,
  defineGenerators,
  defineStyle,
  defineTheme,
  defineThemeColor,
} from './define-config'

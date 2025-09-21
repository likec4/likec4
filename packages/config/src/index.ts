export type {
  GeneratorFn,
  GeneratorFnContext,
  GeneratorFnParams,
  LikeC4ProjectConfig,
  LikeC4ProjectConfigInput,
  LikeC4ProjectJsonConfig,
} from './schema'

export { serializableLikeC4ProjectConfig, validateProjectConfig } from './schema'

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

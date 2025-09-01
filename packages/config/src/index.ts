export type {
  GeneratorFn,
  GeneratorFnContext,
  GeneratorFnParams,
  LikeC4ProjectConfig,
  LikeC4ProjectJsonConfig,
} from './schema'

export { validateProjectConfig } from './schema'

export {
  ConfigFilenames,
  isLikeC4Config,
  isLikeC4JsonConfig,
  isLikeC4NonJsonConfig,
} from './filenames'

export {
  defineConfig,
  defineGenerators,
} from './define-config'

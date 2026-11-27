/**
 * Node API of the LikeC4 app: the dev server, the preview, the builds and the app config.
 * Used by the `likec4` CLI (with the app from the package) and by `pnpm dev` (with the app from sources).
 */

export type { AppSource } from './app-source'

export {
  AppConfigFilenames,
  type AppConfigFlags,
  findAppConfig,
  type LikeC4AppConfigInput,
  LikeC4AppConfigSchema,
  loadAppConfig,
  type ParsedLikeC4AppConfig,
  resolveAppConfig,
  type ResolvedAppConfig,
} from './app-config'

export { buildApp, type BuildAppOptions } from './build'
export { type AppViteOptions, normalizeBase } from './config-app'
export { startDev, type StartDevOptions } from './dev'
export { createViteLogger, type ViteLogger } from './logger'
export { startPreview, type StartPreviewOptions } from './preview'
export { buildReact, type BuildReactOptions } from './react'
export { copyUserPublicDir, mkTempPublicDir, relativeToCwd } from './utils'
export { buildWebcomponent, type BuildWebcomponentOptions } from './webcomponent'

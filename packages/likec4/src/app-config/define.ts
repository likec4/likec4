// Only types are imported here: this module is a part of `likec4/config`,
// which must not load the schema and the Vite plugin at runtime
import type { LikeC4AppConfigInput } from './schema'

export type { LikeC4AppConfigInput }

/**
 * Defines the LikeC4 app config: options of the application, its build and the dev server,
 * that otherwise are given to the CLI as flags.
 *
 * The CLI looks for `likec4.app.config.{ts,mts,cts,js,mjs,cjs}` in the workspace and in the current directory.
 * Paths are relative to the config file. Flags of the CLI take precedence over the config.
 *
 * @experimental
 * @example
 * ```ts
 * // likec4.app.config.ts
 * import { defineAppConfig } from 'likec4/config'
 *
 * export default defineAppConfig({
 *   title: 'My Architecture',
 *   customization: './likec4.customization.tsx',
 *   build: {
 *     outDir: './dist',
 *   },
 * })
 * ```
 */
export function defineAppConfig(config: LikeC4AppConfigInput): LikeC4AppConfigInput {
  return config
}

import z from 'zod/v4'

/**
 * Options of the LikeC4 application, shared by the Vite plugin and the app config of the CLI.
 *
 * @experimental
 */
export const LikeC4AppOptionsSchema = z.object({
  /**
   * Base title of the application pages
   * @default 'LikeC4'
   */
  title: z.string().nonempty().default('LikeC4'),
  /**
   * Default color scheme of the application, follows the system preference if not set
   */
  theme: z.enum(['light', 'dark']).optional(),
  /**
   * Use hash history for navigation, e.g. `/#/view` instead of `/view`
   * @default false
   */
  useHashHistory: z.boolean().default(false),
  /**
   * Prefix for webcomponents, e.g. `c4` generates `<c4-view/>`
   * @default 'likec4'
   */
  webcomponentPrefix: z.string().nonempty().default('likec4'),
  /**
   * Path to the file that customizes LikeC4 UI.
   * The file must default-export the result of `defineCustomComponents` from `likec4/react`.
   *
   * The overrides are applied to the LikeC4 application and to the components from `likec4:react`.
   *
   * @example
   * ```tsx
   * // likec4.customization.tsx
   * import { defineCustomComponents } from 'likec4/react'
   *
   * export default defineCustomComponents(({ wrap }) => ({
   *   LikeC4Diagram: wrap(({ Original, ...props }) => (
   *     <Original {...props} pannable={false} />
   *   )),
   * }))
   * ```
   */
  customization: z.string().nonempty().optional(),
})

/**
 * Options of the LikeC4 application as written by the user, see {@link LikeC4AppOptionsSchema}
 *
 * @experimental
 */
export type LikeC4AppOptions = z.input<typeof LikeC4AppOptionsSchema>

/**
 * Options of the LikeC4 application with defaults applied
 */
export type ResolvedLikeC4AppOptions = z.output<typeof LikeC4AppOptionsSchema>

/**
 * @deprecated Use {@link LikeC4AppOptions} at the top level of the plugin options
 */
export interface LikeC4AppConfig {
  /**
   * @deprecated Use `webcomponentPrefix` at the top level of the plugin options
   */
  webcomponentPrefix?: string
  /**
   * @deprecated Use `title` at the top level of the plugin options
   */
  pageTitle?: string
  /**
   * @deprecated Use `useHashHistory` at the top level of the plugin options
   */
  useHashHistory?: boolean | undefined
  /**
   * @deprecated Use `theme` at the top level of the plugin options
   */
  theme?: 'light' | 'dark' | undefined
}

/**
 * Applies defaults to the application options.
 * Options at the top level win over the deprecated `appConfig`.
 */
export function resolveAppOptions(
  options: LikeC4AppOptions,
  deprecated?: LikeC4AppConfig,
): ResolvedLikeC4AppOptions {
  return LikeC4AppOptionsSchema.parse({
    title: options.title ?? deprecated?.pageTitle,
    theme: options.theme ?? deprecated?.theme,
    useHashHistory: options.useHashHistory ?? deprecated?.useHashHistory,
    webcomponentPrefix: options.webcomponentPrefix ?? deprecated?.webcomponentPrefix,
    customization: options.customization,
  })
}

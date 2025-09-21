import type { LikeC4ProjectStylesConfig, LikeC4ProjectTheme, ThemeColorValues } from '@likec4/core/types'
import type { GeneratorFn, LikeC4ProjectConfig, LikeC4ProjectConfigInput } from './schema'
import { GeneratorsSchema, LikeC4ProjectConfigSchema } from './schema'
import {
  type LikeC4ConfigThemeInput,
  type LikeC4StylesConfigInput,
  type ThemeColorValuesInput,
  LikeC4Config_Styles_Theme,
  LikeC4StylesConfigSchema,
  ThemeColorValuesSchema,
} from './schema.theme'

/**
 * Defines LikeC4 Project, allows custom generators that can be executed using CLI:
 *
 * `$ likec4 gen <generator-name>`
 *
 * or VSCode command `LikeC4: Run code generator`
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   name: 'my-project',
 *   title: 'My Project',
 *   exclude: ['picomatch pattern'],
 *   generators: {
 *     'my-generator': async ({ likec4model, ctx }) => {
 *       await ctx.write('my-generator.txt', likec4model.project.id)
 *     }
 *   }
 * })
 * ```
 */
export function defineConfig<C extends LikeC4ProjectConfigInput>(config: C): LikeC4ProjectConfig {
  return LikeC4ProjectConfigSchema.parse(config) as unknown as LikeC4ProjectConfig
}

/**
 * Define reusable custom generators
 *
 * @example
 * ```ts
 * // generators.ts
 * export default defineGenerators({
 *   'my-generator': async ({ likec4model, ctx }) => {
 *     await ctx.write('my-generator.txt', likec4model.project.id)
 *   }
 * })
 *
 * // likec4.config.ts
 * import generators from './generators'
 *
 * export default defineConfig({
 *   name: 'my-project',
 *   generators,
 * })
 * ```
 */
export function defineGenerators<const G extends Record<string, GeneratorFn>>(generators: G): G {
  return GeneratorsSchema.parse(generators) as unknown as G
}

/**
 * Define reusable custom style
 * @example
 * ```ts
 * // styles.ts
 * export default defineStyle({
 *   theme: {
 *     colors: {
 *       primary: '#FF0000'
 *     }
 *   },
 *   defaults: {
 *     element: {
 *       opacity: 0.5
 *     },
 *     relationship: {
 *       color: 'grey'
 *       line: 'solid'
 *     }
 *   }
 * })
 */
export function defineStyle<const S extends LikeC4StylesConfigInput>(styles: S): LikeC4ProjectStylesConfig {
  return LikeC4StylesConfigSchema.parse(styles)
}

/**
 * Define reusable custom theme
 * @example
 * ```ts
 * export default defineTheme({
 *   colors: {
 *     primary: '#FF0000'
 *   }
 * })
 * ```
 */
export function defineTheme<const S extends LikeC4ConfigThemeInput>(theme: S): LikeC4ProjectTheme {
  return LikeC4Config_Styles_Theme.parse(theme)
}

/**
 * Define reusable custom theme color
 * @example
 * ```ts
 * export default defineThemeColor({
 *   element: {
 *     fill: 'red'
 *   }
 * })
 * ```
 */
export function defineThemeColor<const S extends ThemeColorValuesInput>(colors: S): ThemeColorValues {
  return ThemeColorValuesSchema.parse(colors)
}

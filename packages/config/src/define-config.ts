import { type GeneratorFn, type LikeC4ProjectConfig, GeneratorsSchema, LikeC4ProjectConfigSchema } from './schema'
import {
  type StylesConfigInput,
  type ThemeColorValues,
  type ThemeConfigInput,
  StylesConfigSchema,
  ThemeColorValuesSchema,
  ThemeConfigSchema,
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
export function defineConfig<const C extends LikeC4ProjectConfig>(config: C): C {
  return LikeC4ProjectConfigSchema.parse(config) as unknown as C
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
export function defineStyle<const S extends StylesConfigInput>(styles: S): S {
  return StylesConfigSchema.parse(styles) as unknown as S
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
export function defineTheme<const S extends ThemeConfigInput>(theme: S): S {
  return ThemeConfigSchema.parse(theme) as unknown as S
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
export function defineThemeColor<const S extends ThemeColorValues>(colors: S): S {
  return ThemeColorValuesSchema.parse(colors) as unknown as S
}

import type { LikeC4ProjectStylesConfig, LikeC4ProjectTheme, ThemeColorValues } from '@likec4/core/types';
import type { GeneratorFn, LikeC4ProjectConfig, LikeC4ProjectConfigInput } from './schema';
import type { LikeC4ConfigThemeInput, LikeC4StylesConfigInput, ThemeColorValuesInput } from './schema.theme';
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
 *
 *   exclude: ['picomatch pattern'],
 *   generators: {
 *     '<generator-name>': async ({ likec4model, ctx }) => {
 *       await ctx.write('my-generator.txt', likec4model.project.id)
 *     }
 *   }
 * })
 * ```
 */
export declare function defineConfig<C extends LikeC4ProjectConfigInput>(config: C): LikeC4ProjectConfig;
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
export declare function defineGenerators<const G extends Record<string, GeneratorFn>>(generators: G): G;
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
export declare function defineThemeColor<const S extends ThemeColorValuesInput>(colors: S): ThemeColorValues;
/**
 * Define reusable custom theme
 * @example
 * ```ts
 * import { defineThemeColor, defineTheme } from 'likec4/config'
 *
 * export default defineTheme({
 *   colors: {
 *     primary: '#FF0000',
 *     // Or use defineThemeColor
 *     red: defineThemeColor({
 *       elements: {
 *         fill: 'red'
 *       }
 *     })
 *   }
 * })
 * ```
 */
export declare function defineTheme<const S extends LikeC4ConfigThemeInput>(theme: S): LikeC4ProjectTheme;
/**
 * Define reusable custom style
 * @example
 * ```ts
 * import { defineStyle, defineThemeColor } from 'likec4/config'
 *
 * export default defineStyle({
 *   theme: {
 *     colors: {
 *       red: defineThemeColor({
 *         elements: {
 *           fill: 'red'
 *         }
 *       })
 *     }
 *   },
 *   defaults: {
 *     color: 'red',
 *     opacity: 50,
 *     border: 'solid',
 *     size: 'sm',
 *     relationship: {
 *       color: 'grey',
 *       line: 'solid',
 *     }
 *   }
 * })
 */
export declare function defineStyle<const S extends LikeC4StylesConfigInput>(styles: S): LikeC4ProjectStylesConfig;

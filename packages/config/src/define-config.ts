import { type GeneratorFn, type LikeC4ProjectConfig, GeneratorsSchema, LikeC4ProjectConfigSchema } from './schema'

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

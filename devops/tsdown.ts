import { defu } from 'defu'
import { type UserConfig, defineConfig as tsdownDefineConfig, Rolldown } from 'tsdown'

export function defineConfig(config: UserConfig | UserConfig[]): UserConfig | UserConfig[] {
  const base: UserConfig = {
    entry: [
      'src/**/*.{ts,tsx}',
      '!**/*.d.ts',
      '!**/*.spec.{ts,tsx}',
    ],
    dts: true,
    outputOptions: outputOptions(),
    minify: true,
    env: {
      NODE_ENV: 'production',
    },
    nodeProtocol: true,
    inputOptions: {
      resolve: {
        conditionNames: ['sources', 'import', 'default'],
      },
    },
    deps: {
      onlyBundle: false,
    },
    ...config,
  }

  if (Array.isArray(config)) {
    return tsdownDefineConfig(config.map(c => ({ ...base, ...c })))
  }
  return tsdownDefineConfig({ ...base, ...config })
}

export function outputOptions(outputOptions?: Rolldown.OutputOptions): Rolldown.OutputOptions {
  return defu(
    outputOptions,
    {
      keepNames: true,
      entryFileNames: '[name].mjs',
      chunkFileNames: 'chunks/[name].mjs',

      codeSplitting: {
        groups: [
          {
            test: /node_modules/,
            name: (moduleId: string) => {
              const pkgName = moduleId.match(/.*\/node_modules\/(?<package>@[^/]+\/[^/]+|[^/]+)/)
                ?.groups?.package
              const isDts = /\.d\.[mc]?ts$/.test(moduleId)
              return `libs/${pkgName || 'common'}${isDts ? '.d' : ''}`
            },
            minShareCount: 2,
            priority: 5,
          },
        ],
      },
    } satisfies Rolldown.OutputOptions,
  )
}

/**
 * Creates a code splitting group for Rolldown
 *
 * @example
 * ```ts
 * outputOptions({
 *   codeSplitting: {
 *     groups: [
 *       codeSplittingGroup(/node_modules\/d3-/, 'libs/d3'),
 *       codeSplittingGroup(/node_modules\/@mantine/, 'libs/@mantine'),
 *       codeSplittingGroup(/node_modules\/@?nanostores/, 'libs/nanostores'),
 *     ],
 *   },
 * }),
 * ```
 */
export function codeSplittingGroup(
  test: RegExp,
  name: string,
  opts?: Partial<Omit<Rolldown.CodeSplittingGroup, 'test' | 'name'>>,
): Rolldown.CodeSplittingGroup {
  return {
    test,
    name: (moduleId: string) => {
      const isDts = /\.d\.[mc]?ts$/.test(moduleId)
      return `${name}${isDts ? '.d' : ''}`
    },
    priority: 10,
    ...opts,
  }
}

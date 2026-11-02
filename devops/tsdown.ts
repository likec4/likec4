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
    platform: 'neutral',
    minify: {
      compress: {
        keepNames: {
          class: true,
          function: true,
        },
      },
    },
    env: {
      NODE_ENV: 'production',
    },
    nodeProtocol: true,
    inputOptions: {
      resolve: {
        mainFields: ['module', 'main'],
        conditionNames: ['sources', 'module', 'import', 'default'],
      },
      onLog(level, log, defaultHandler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
          return // Ignore module level directive warnings
        }
        defaultHandler(level, log) // otherwise, just print the log
      },
    },
    deps: {
      onlyBundle: false,
    },
    checks: {
      bundlerTimings: false,
    },
    ...config,
  }

  if (Array.isArray(config)) {
    return tsdownDefineConfig(config.map(c => ({ ...base, ...c, plugins: [stubBrotli(), c.plugins] })))
  }
  return tsdownDefineConfig({ ...base, ...config, plugins: [stubBrotli(), config.plugins] })
}

const stubBrotliId = '\0likec4:stub-brotli'

/**
 * fontkit statically imports `brotli/decompress.js` (~490KB), but uses it only to decode WOFF2 fonts.
 * We embed TTF faces (see packages/layouts/scripts/generate-fonts.ts), so it is replaced with a stub.
 */
export function stubBrotli(): Rolldown.Plugin {
  return {
    name: 'likec4:stub-brotli',
    resolveId: {
      filter: { id: /^brotli\/decompress(\.js)?$/ },
      handler: () => stubBrotliId,
    },
    load: {
      filter: { id: new RegExp(`^${stubBrotliId}$`) },
      handler: () =>
        `export default function decompress() { throw new Error('WOFF2 fonts are not supported, brotli is stubbed') }`,
    },
  }
}

/**
 * Creates a code splitting group for node_modules
 */
export function nodeModulesCodeSplitting(
  opts?: Partial<Omit<Rolldown.CodeSplittingGroup, 'test' | 'name'>>,
): Rolldown.CodeSplittingGroup {
  return {
    test: /node_modules/,
    debugName: 'node_modules',
    name: (moduleId: string) => {
      const pkgName = moduleId.match(/.*\/node_modules\/(?<package>@[^/]+\/[^/]+|[^/]+)/)
        ?.groups?.['package']
      const isDts = /\.d\.[mc]?ts$/.test(moduleId)
      return `libs/${pkgName || 'common'}${isDts ? '.d' : ''}`
    },
    minShareCount: 2,
    minSize: 5 * 1024, /* 5KB */
    ...opts,
  }
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
    debugName: name,
    name: (moduleId: string) => {
      const isDts = /\.d\.[mc]?ts$/.test(moduleId)
      return `${name}${isDts ? '.d' : ''}`
    },
    priority: 10,
    ...opts,
  }
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
          nodeModulesCodeSplitting({
            priority: 2,
          }),
        ],
      },
    } satisfies Rolldown.OutputOptions,
  )
}

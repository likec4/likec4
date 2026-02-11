import {
  createLanguageServices as createBrowserLanguageServices,
} from '@likec4/language-server/browser'
import { configureLogger, getConsoleSink, getTextFormatter, rootLogger } from '@likec4/log'
import { createFromSources } from '../common/createFromSources'
import { LikeC4 } from '../common/LikeC4'
import type { FromWorkspaceOptions, InitOptions } from '../common/options'

export type {
  FromWorkspaceOptions,
  InitOptions,
  LikeC4,
}

/**
 * Create a LikeC4 instance from a workspace directory
 * @param _workspace - The workspace directory path
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkspace(_workspace: string, _options?: FromWorkspaceOptions): Promise<LikeC4> {
  throw new Error(`fromWorkspace is not yet implemented in the browser environment. use fromSources`)
}

/**
 * Create a LikeC4 instance from the current working directory
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkdir(_options?: FromWorkspaceOptions): Promise<LikeC4> {
  throw new Error(`fromWorkdir is not yet implemented in the browser environment, use fromSources`)
}

/**
 * Create a LikeC4 instance from a record of source files
 *
 * @example
 * ```ts
 * const likec4 = await fromSources({
 *   'likec4.config.json': '...', // optional, stringified LikeC4Config
 *   'model.c4': 'model { ... }',
 *   'path/views.c4': 'views { ... }',
 * })
 * ```
 *
 * @param sources - A record of file paths to source content
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromSources(sources: Record<string, string>): Promise<LikeC4> {
  configureLogger({
    sinks: {
      console: getConsoleSink({
        formatter: getTextFormatter({
          format: ({ level, category, message }) => {
            return `${level} ${category} ${message}`
          },
        }),
      }),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console'],
        lowestLevel: 'debug',
      },
    ],
  })

  const logger = rootLogger.getChild('lang')

  const langium = createBrowserLanguageServices()

  return await createFromSources(langium, logger, sources)
}

/**
 * Create a LikeC4 instance from a single source string
 * @param source - The LikeC4 source code

 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromSource(source: string): Promise<LikeC4> {
  return fromSources({ 'source.c4': source })
}

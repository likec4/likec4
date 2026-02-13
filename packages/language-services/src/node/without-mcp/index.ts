import { memoizeProp } from '@likec4/core'
import { rootLogger } from '@likec4/log'
import defu from 'defu'
import { basename, resolve } from 'pathe'
import k from 'tinyrainbow'
import { pathToFileURL } from 'url'
import { createFromSources } from '../../common/createFromSources'
import { handleInitOptions } from '../../common/handleInitOptions'
import { type LikeC4Langium, LikeC4 } from '../../common/LikeC4'
import type { FromWorkspaceOptions, InitOptions } from '../../common/options'
import { type CreateLanguageServiceOptions, createLanguageServices } from './createLanguageServices'

export type {
  FromWorkspaceOptions,
  InitOptions,
  LikeC4Langium,
}

export { LikeC4 } from '../../common/LikeC4'

/**
 * Create a LikeC4 instance from a workspace directory
 * The instance is cached in globalThis to avoid creating multiple instances for the same workspace
 *
 * @param path - The workspace directory path
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkspace(path: string, options?: FromWorkspaceOptions): Promise<LikeC4> {
  const workspacePath = resolve(path)
  const folderUri = pathToFileURL(workspacePath).toString()
  const workspaceUri = folderUri.endsWith('/') ? folderUri : folderUri + '/'
  return memoizeProp(globalThis, 'likec4:' + workspacePath, async () => {
    const logger = rootLogger.getChild('lang')

    const mergedOptions = defu(
      options,
      {
        useFileSystem: true,
        manualLayouts: true,
        watch: false,
      } satisfies CreateLanguageServiceOptions,
    )
    if (mergedOptions.mcp) {
      throw new Error('MCP server is not supported in this build')
    }

    const langium = createLanguageServices(mergedOptions)

    const workspace = {
      name: basename(workspacePath),
      uri: workspaceUri,
    }

    const WorkspaceManager = langium.shared.workspace.WorkspaceManager
    logger.info(`${k.dim('workspace:')} ${workspacePath}`)
    WorkspaceManager.initialize({
      capabilities: {},
      processId: null,
      rootUri: null,
      workspaceFolders: [workspace],
    })
    await WorkspaceManager.initializeWorkspace([
      workspace,
    ])

    const userDocuments = langium.shared.workspace.LangiumDocuments.userDocuments.toArray()

    if (userDocuments.length === 0) {
      logger.error(`no LikeC4 sources found`)
      throw new Error(`no LikeC4 sources found`)
    }

    logger.info(`${k.dim('workspace:')} found ${userDocuments.length} source files`)

    return handleInitOptions(langium, rootLogger, options)
  })
}

/**
 * Create a LikeC4 instance from the current working directory
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkdir(options?: FromWorkspaceOptions): Promise<LikeC4> {
  return fromWorkspace('.', options)
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
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromSources(sources: Record<string, string>, options?: InitOptions): Promise<LikeC4> {
  const logger = rootLogger.getChild('lang')

  const langium = createLanguageServices(
    defu(
      options,
      {
        useFileSystem: false,
        watch: false,
        manualLayouts: false,
      } satisfies CreateLanguageServiceOptions,
    ),
  )

  return await createFromSources(langium, logger, sources, options)
}

/**
 * Create a LikeC4 instance from a single source string
 * @param source - The LikeC4 source code
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromSource(source: string, options?: InitOptions): Promise<LikeC4> {
  return fromSources({ 'source.c4': source }, options)
}

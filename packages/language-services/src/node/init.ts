import { type Logger, rootLogger } from '@likec4/log'
import defu from 'defu'
import { basename, resolve } from 'pathe'
import k from 'tinyrainbow'
import { pathToFileURL } from 'url'
import { type LikeC4, type LikeC4Langium, AbstractLikeC4 } from '../common/LikeC4'
import type { FromWorkspaceOptions } from '../common/options'
import { createLanguageServices } from './createLanguageServices'

/**
 * Create a LikeC4 instance from a workspace directory
 * @param _workspace - The workspace directory path
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkspace(_workspace: string, options?: FromWorkspaceOptions): Promise<LikeC4> {
  const workspacePath = resolve(_workspace)

  const workspace = {
    name: basename(workspacePath),
    uri: pathToFileURL(workspacePath).toString(),
  }

  const logger = rootLogger.getChild('lang')

  const langium = createLanguageServices(defu(options, {
    useFileSystem: true,
    manualLayouts: true,
    watch: false,
  }))

  const WorkspaceManager = langium.shared.workspace.WorkspaceManager
  logger.info(`{workspace}`, { workspace })
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

  return new (class extends AbstractLikeC4 {
    constructor(
      protected langium: LikeC4Langium,
      protected logger: Logger,
    ) {
      super()
    }
  })(langium, rootLogger.getChild('LikeC4'))
}

/**
 * Create a LikeC4 instance from the current working directory
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkdir(options?: FromWorkspaceOptions): Promise<LikeC4> {
  return fromWorkspace('.', options)
}

import { isLikeC4Builtin } from '@likec4/language-server/likec4lib'
import type { CliServices } from './module'

import type { WorkspaceFolder } from 'langium'
import k from 'tinyrainbow'

export class CliWorkspace {
  private isInitialized = false

  constructor(private services: CliServices) {
  }

  async initWorkspace(workspace: WorkspaceFolder): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Workspace already initialized')
    }
    this.isInitialized = true
    const logger = this.services.logger
    const WorkspaceManager = this.services.shared.workspace.WorkspaceManager
    logger.info(`${k.dim('workspace:')} ${workspace.uri}`)
    WorkspaceManager.initialize({
      capabilities: {},
      processId: null,
      rootUri: null,
      workspaceFolders: [workspace],
    })
    await WorkspaceManager.initializeWorkspace([
      workspace,
    ])

    const alldocuments = this.services.shared.workspace.LangiumDocuments.all.toArray()
    const workspaceDocuments = alldocuments.filter(d => !isLikeC4Builtin(d.uri))

    if (workspaceDocuments.length === 0) {
      logger.error(`no LikeC4 sources found`)
      throw new Error(`no LikeC4 sources found`)
    }

    logger.info(`${k.dim('workspace:')} found ${workspaceDocuments.length} source files`)
  }
}

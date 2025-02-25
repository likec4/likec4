import { isLikeC4Builtin } from '@likec4/language-server'
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
  }

  async init() {
    if (this.isInitialized) {
      throw new Error('Workspace already initialized')
    }
    this.isInitialized = true
    const logger = this.services.logger
    const modelBuilder = this.services.likec4.ModelBuilder
    const LangiumDocuments = this.services.shared.workspace.LangiumDocuments
    const DocumentBuilder = this.services.shared.workspace.DocumentBuilder

    const alldocuments = LangiumDocuments.all.toArray()
    const workspaceDocuments = alldocuments.filter(d => !isLikeC4Builtin(d.uri))

    if (workspaceDocuments.length === 0) {
      logger.error(`no LikeC4 sources found`)
      throw new Error(`no LikeC4 sources found`)
    }

    logger.info(`${k.dim('workspace:')} found ${workspaceDocuments.length} source files`)

    if (workspaceDocuments.length > 1) {
      await DocumentBuilder.update(workspaceDocuments.map(d => d.uri), [], undefined)
    } else {
      await DocumentBuilder.build(alldocuments, { validation: true })
    }

    const model = await modelBuilder.buildLikeC4Model()
    const viewsCount = [...model.views()].length

    if (viewsCount === 0) {
      logger.warn(`${k.dim('workspace:')} no views found`)
      return
    }

    logger.info(`${k.dim('workspace:')} ${k.green(`✓ computed ${viewsCount} views`)}`)
  }
}

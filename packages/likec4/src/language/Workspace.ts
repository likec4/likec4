import type { CliServices } from './module'

import type { WorkspaceFolder } from 'langium'
import { values } from 'remeda'
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
      workspaceFolders: [workspace]
    })
    await WorkspaceManager.initializeWorkspace([
      workspace
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

    const documents = LangiumDocuments.all.toArray()
    if (documents.length === 0) {
      logger.error(`no LikeC4 sources found`)
      throw new Error(`no LikeC4 sources found`)
    }

    logger.info(`${k.dim('workspace:')} found ${documents.length} source files`)

    await DocumentBuilder.build(documents, { validation: true })

    const model = await modelBuilder.buildComputedModel()
    const viewsCount = values(model?.views ?? {}).length

    if (viewsCount === 0) {
      logger.warn(`${k.dim('workspace:')} no views found`)
      return
    }

    logger.info(`${k.dim('workspace:')} ${k.green(`✓ computed ${viewsCount} views`)}`)

    const diagrams = await this.services.likec4.Views.diagrams()
    if (diagrams.length === viewsCount) {
      logger.info(`${k.dim('workspace:')} ${k.green(`✓ all views layouted`)}`)
    } else {
      logger.warn(`${k.dim('workspace:')} ${k.yellow(`✗ layouted ${diagrams.length} views`)}`)
    }
  }
}

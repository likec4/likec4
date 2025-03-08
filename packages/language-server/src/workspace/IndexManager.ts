import type { ProjectId } from '@likec4/core'
import { type AstNodeDescription, type LangiumDocument, type Stream, DefaultIndexManager, stream } from 'langium'
import { CancellationToken } from 'vscode-jsonrpc'
import type { LikeC4SharedServices } from '../module'
import type { ProjectsManager } from './ProjectsManager'

export class IndexManager extends DefaultIndexManager {
  private projects: ProjectsManager

  constructor(services: LikeC4SharedServices) {
    super(services)
    this.projects = services.workspace.ProjectsManager
  }

  override async updateContent(document: LangiumDocument, cancelToken = CancellationToken.None): Promise<void> {
    // Ensure the document is assigned to a project
    document.likec4ProjectId = this.projects.belongsTo(document.uri)
    await super.updateContent(document, cancelToken)
  }

  projectElements(projectId: ProjectId, nodeType?: string, uris?: Set<string>): Stream<AstNodeDescription> {
    let documentUris = stream(this.symbolIndex.keys())
    return documentUris
      .filter(uri => this.projects.belongsTo(uri) === projectId && (!uris || uris.has(uri)))
      .flatMap(uri => this.getFileDescriptions(uri, nodeType))
  }
}

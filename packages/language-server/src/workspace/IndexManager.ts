import { type ProjectId, ifilter } from '@likec4/core'
import { type AstNodeDescription, type LangiumDocument, type Stream, DefaultIndexManager, stream } from 'langium'
import { CancellationToken } from 'vscode-jsonrpc'
import type { LikeC4SharedServices } from '../module'

export class IndexManager extends DefaultIndexManager {
  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  override async updateContent(document: LangiumDocument, cancelToken = CancellationToken.None): Promise<void> {
    const projects = this.services.workspace.ProjectsManager
    // Ensure the document is assigned to a project
    document.likec4ProjectId = projects.belongsTo(document.uri)
    await super.updateContent(document, cancelToken)
  }

  projectElements(projectId: ProjectId, nodeType?: string, uris?: Set<string>): Stream<AstNodeDescription> {
    const projects = this.services.workspace.ProjectsManager
    return stream(
      ifilter(
        this.symbolIndex.keys(),
        uri => projects.belongsTo(uri) === projectId && (!uris || uris.has(uri)),
      ),
    ).flatMap(uri => this.getFileDescriptions(uri, nodeType))
  }
}

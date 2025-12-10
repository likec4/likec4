import type { ProjectId } from '@likec4/core'
import { type AstNodeDescription, type LangiumDocument, type Stream, DefaultIndexManager, stream } from 'langium'
import type { CancellationToken } from 'vscode-languageserver'
import type { LikeC4SharedServices } from '../module'

export class IndexManager extends DefaultIndexManager {
  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  override async updateContent(document: LangiumDocument, cancelToken?: CancellationToken): Promise<void> {
    const projects = this.services.workspace.ProjectsManager
    // Ensure the document is assigned to a project
    document.likec4ProjectId = projects.belongsTo(document)
    await super.updateContent(document, cancelToken)
  }

  projectElements(projectId: ProjectId, nodeType?: string, uris?: Set<string>): Stream<AstNodeDescription> {
    const projects = this.services.workspace.ProjectsManager
    const project = projects.getProject(projectId)

    const includePathStrings = project.includePaths?.map(uri => {
      const path = uri.toString()
      return path.endsWith('/') ? path : path + '/'
    }) ?? []

    let documentUris = stream(this.symbolIndex.keys())
    return documentUris
      .filter(uri => {
        const belongsToProject = projects.belongsTo(uri) === projectId
        const inIncludePath = includePathStrings.length > 0 &&
          includePathStrings.some(includePath => uri.startsWith(includePath))
        return (belongsToProject || inIncludePath) && (!uris || uris.has(uri))
      })
      .flatMap(uri => this.getFileDescriptions(uri, nodeType))
  }
}

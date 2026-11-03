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
    document.likec4ProjectId = projects.ownerProjectId(document)
    await super.updateContent(document, cancelToken)
  }

  /**
   * In addition to Langium references, a document is affected when it may have element/view refs
   * in Markdown (`[[cloud.api]]`, `[[view:index]]`) and any changed document is in the same project.
   * Such refs are not Langium references, so without this their warnings would go stale
   * when the referenced element or view is added, renamed or removed in another document.
   * Kept cheap: a substring check on the text, no parsing.
   */
  override isAffected(document: LangiumDocument, changedUris: Set<string>): boolean {
    if (super.isAffected(document, changedUris)) {
      return true
    }
    if (changedUris.size === 0 || !document.textDocument.getText().includes('[[')) {
      return false
    }
    const projects = this.services.workspace.ProjectsManager
    const projectId = document.likec4ProjectId ?? projects.ownerProjectId(document)
    for (const uri of changedUris) {
      if (projects.isIncluded(projectId, uri)) {
        return true
      }
    }
    return false
  }

  projectElements(projectId: ProjectId, nodeType?: string, uris?: Set<string>): Stream<AstNodeDescription> {
    const projects = this.services.workspace.ProjectsManager
    let documentUris = stream(this.symbolIndex.keys())
    return documentUris
      .filter(uri => {
        if (uris && !uris.has(uri)) {
          return false
        }
        return projects.isIncluded(projectId, uri)
      })
      .flatMap(uri => this.getFileDescriptions(uri, nodeType))
  }
}

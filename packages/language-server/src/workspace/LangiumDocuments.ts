import type { NonEmptyArray, ProjectId } from '@likec4/core'
import { type Stream, DefaultLangiumDocuments } from 'langium'
import { groupBy, prop } from 'remeda'
import { type LikeC4LangiumDocument, isLikeC4LangiumDocument } from '../ast'
import { isLikeC4Builtin } from '../likec4lib'
import type { LikeC4SharedServices } from '../module'

export class LangiumDocuments extends DefaultLangiumDocuments {
  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  /**
   * Returns all user documents, excluding built-in documents.
   */
  get allExcludingBuiltin(): Stream<LikeC4LangiumDocument> {
    const projects = this.services.workspace.ProjectsManager
    return super.all.filter((doc): doc is LikeC4LangiumDocument => {
      if (!isLikeC4LangiumDocument(doc) || isLikeC4Builtin(doc.uri) || projects.checkIfExcluded(doc)) {
        return false
      }
      doc.likec4ProjectId = projects.belongsTo(doc.uri)
      return true
    })
  }

  projectDocuments(projectId: ProjectId): Stream<LikeC4LangiumDocument> {
    return this.allExcludingBuiltin.filter(doc => doc.likec4ProjectId === projectId)
  }

  groupedByProject(): Record<ProjectId, NonEmptyArray<LikeC4LangiumDocument>> {
    return groupBy(this.allExcludingBuiltin.toArray(), prop('likec4ProjectId'))
  }

  resetProjectIds(): void {
    const projects = this.services.workspace.ProjectsManager
    this.all.forEach(doc => {
      if (!isLikeC4LangiumDocument(doc) || isLikeC4Builtin(doc.uri)) {
        return
      }
      doc.likec4ProjectId = projects.belongsTo(doc)
    })
  }
}

import type { NonEmptyArray, ProjectId } from '@likec4/core'
import { type Stream, DefaultLangiumDocuments } from 'langium'
import { groupBy, prop } from 'remeda'
import { type LikeC4LangiumDocument, isLikeC4LangiumDocument } from '../ast'
import { isLikeC4Builtin } from '../likec4lib'
import type { LikeC4SharedServices } from '../module'
import type { ProjectsManager } from './ProjectsManager'

export class LangiumDocuments extends DefaultLangiumDocuments {
  private projects: ProjectsManager

  constructor(services: LikeC4SharedServices) {
    super(services)
    this.projects = services.workspace.ProjectsManager
  }

  /**
   * Returns all user documents, excluding built-in documents.
   */
  get userDocuments(): Stream<LikeC4LangiumDocument> {
    return super.all.filter((doc): doc is LikeC4LangiumDocument => {
      if (!isLikeC4LangiumDocument(doc) || isLikeC4Builtin(doc.uri)) {
        return false
      }
      if (!doc.likec4ProjectId) {
        doc.likec4ProjectId = this.projects.belongsTo(doc.uri)
      }
      return true
    })
  }

  projectDocuments(projectId: ProjectId): Stream<LikeC4LangiumDocument> {
    return this.userDocuments.filter(doc => doc.likec4ProjectId === projectId)
  }

  groupedByProject(): Record<ProjectId, NonEmptyArray<LikeC4LangiumDocument>> {
    return groupBy(this.userDocuments.toArray(), prop('likec4ProjectId'))
  }
}

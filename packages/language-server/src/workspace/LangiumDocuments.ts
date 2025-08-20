import type { NonEmptyArray, ProjectId } from '@likec4/core'
import { compareNaturalHierarchically } from '@likec4/core/utils'
import type { LangiumDocument, Stream } from 'langium'
import { DefaultLangiumDocuments } from 'langium'
import { groupBy, prop } from 'remeda'
import { type LikeC4LangiumDocument, isLikeC4LangiumDocument } from '../ast'
import { isLikeC4Builtin } from '../likec4lib'
import type { LikeC4SharedServices } from '../module'

/**
 * Compare function for document paths to ensure consistent order
 */
const compare = compareNaturalHierarchically('/', true)
const ensureOrder = (a: LangiumDocument, b: LangiumDocument) => compare(a.uri.path, b.uri.path)

export class LangiumDocuments extends DefaultLangiumDocuments {
  protected compare = compareNaturalHierarchically('/', true)

  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  override addDocument(document: LangiumDocument): void {
    const uriString = document.uri.toString()
    if (this.documentMap.has(uriString)) {
      throw new Error(`A document with the URI '${uriString}' is already present.`)
    }
    const docs = [...this.documentMap.values(), document].sort(ensureOrder)
    // Clear and re-add documents to ensure consistent order
    this.documentMap.clear()
    for (const doc of docs) {
      this.documentMap.set(doc.uri.toString(), doc)
    }
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

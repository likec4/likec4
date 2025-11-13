import type { NonEmptyArray, ProjectId } from '@likec4/core'
import { compareNaturalHierarchically } from '@likec4/core/utils'
import type { LangiumDocument, Stream, URI } from 'langium'
import { DefaultLangiumDocuments, stream } from 'langium'
import { groupBy, prop } from 'remeda'
import { type LikeC4LangiumDocument, isLikeC4LangiumDocument } from '../ast'
import { LikeC4LanguageMetaData } from '../generated/module'
import { isLikeC4Builtin } from '../likec4lib'
import type { LikeC4SharedServices } from '../module'

/**
 * Compare function for document paths to ensure consistent order
 */
const compare = compareNaturalHierarchically('/', true)
const ensureOrder = (a: LangiumDocument, b: LangiumDocument) => compare(a.uri.path, b.uri.path)

const exclude = (doc: LangiumDocument) => {
  return doc.textDocument.languageId !== LikeC4LanguageMetaData.languageId || isLikeC4Builtin(doc.uri)
}

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

  override getDocument(uri: URI): LikeC4LangiumDocument | undefined {
    const doc = super.getDocument(uri)
    if (doc && !exclude(doc)) {
      doc.likec4ProjectId ??= this.services.workspace.ProjectsManager.belongsTo(doc)
    }
    if (doc && !isLikeC4LangiumDocument(doc)) {
      throw new Error(`Document ${doc.uri.path} is not a LikeC4 document`)
    }
    return doc
  }

  override get all(): Stream<LikeC4LangiumDocument> {
    return stream(this.documentMap.values())
      .filter((doc): doc is LikeC4LangiumDocument => {
        if (doc.textDocument.languageId === LikeC4LanguageMetaData.languageId) {
          if (!isLikeC4Builtin(doc.uri)) {
            doc.likec4ProjectId ??= this.services.workspace.ProjectsManager.belongsTo(doc)
          }
          return true
        }
        return false
      })
  }

  /**
   * Returns all user documents, excluding built-in documents.
   */
  get allExcludingBuiltin(): Stream<LikeC4LangiumDocument> {
    const projects = this.services.workspace.ProjectsManager
    return super.all.filter((doc): doc is LikeC4LangiumDocument => {
      // Exclude built-in and non-LikeC4 documents, and also documents excluded by ProjectsManager
      return !exclude(doc) && !projects.isExcluded(doc)
    })
  }

  projectDocuments(projectId: ProjectId): Stream<LikeC4LangiumDocument> {
    return this.allExcludingBuiltin.filter(doc => doc.likec4ProjectId === projectId)
  }

  groupedByProject(): Record<ProjectId, NonEmptyArray<LikeC4LangiumDocument>> {
    return groupBy(this.allExcludingBuiltin.toArray(), prop('likec4ProjectId'))
  }
}

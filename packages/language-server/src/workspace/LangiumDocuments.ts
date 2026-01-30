import type { NonEmptyArray, ProjectId } from '@likec4/core'
import { compareNaturalHierarchically } from '@likec4/core/utils'
import type { LangiumDocument, Stream, URI } from 'langium'
import { DefaultLangiumDocuments, stream } from 'langium'
import { groupBy, map, pipe, prop } from 'remeda'
import { type LikeC4LangiumDocument, isLikeC4LangiumDocument } from '../ast'
import { isNotLikeC4Builtin } from '../likec4lib'
import type { LikeC4SharedServices } from '../module'
import type { ProjectsManager } from './ProjectsManager'

/**
 * Compare function for document paths to ensure consistent order
 */
const compare = compareNaturalHierarchically('/')
const ensureOrder = (a: LangiumDocument, b: LangiumDocument) => compare(a.uri.path, b.uri.path)

const isLikeC4UserDocument = (doc: LangiumDocument | undefined): doc is LikeC4LangiumDocument =>
  isLikeC4LangiumDocument(doc) && isNotLikeC4Builtin(doc)

export class LangiumDocuments extends DefaultLangiumDocuments {
  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  protected get projectsManager(): ProjectsManager {
    return this.services.workspace.ProjectsManager
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
    if (isLikeC4UserDocument(document)) {
      // Set project ID
      document.likec4ProjectId = this.projectsManager.ownerProjectId(document)
    }
  }

  override getDocument(uri: URI): LangiumDocument | undefined {
    const doc = super.getDocument(uri)
    if (isLikeC4UserDocument(doc)) {
      // Set project ID
      doc.likec4ProjectId = this.projectsManager.ownerProjectId(doc)
    }
    return doc
  }

  /**
   * Returns all user documents
   */
  get userDocuments(): Stream<LikeC4LangiumDocument> {
    return stream(this.documentMap.values())
      .filter((doc): doc is LikeC4LangiumDocument => isLikeC4UserDocument(doc) && !this.projectsManager.isExcluded(doc))
  }
  /**
   * Returns all documents (ensures project IDs are set)
   */
  override get all(): Stream<LangiumDocument> {
    return stream(this.documentMap.values()).map((doc) => {
      if (isLikeC4UserDocument(doc)) {
        doc.likec4ProjectId = this.projectsManager.ownerProjectId(doc)
      }
      return doc
    })
  }

  /**
   * Returns all documents for a project, including both project documents and documents included by the project.
   */
  projectDocuments(projectId: ProjectId): Stream<LikeC4LangiumDocument> {
    const projects = this.services.workspace.ProjectsManager
    return stream(this.documentMap.values())
      .filter((doc): doc is LikeC4LangiumDocument => {
        if (isLikeC4UserDocument(doc) && projects.isIncluded(projectId, doc)) {
          doc.likec4ProjectId = projectId
          return true
        }
        return false
      })
  }

  groupedByProject(): Record<ProjectId, NonEmptyArray<LikeC4LangiumDocument>> {
    const projects = this.services.workspace.ProjectsManager
    return pipe(
      this.userDocuments.toArray(),
      map(doc => {
        doc.likec4ProjectId = projects.ownerProjectId(doc)
        return doc
      }),
      groupBy(prop('likec4ProjectId')),
    )
  }

  /**
   * Reset the project IDs of all documents.
   * Returns the URIs
   */
  resetProjectIds(): URI[] {
    const uris = [] as URI[]
    for (const doc of this.documentMap.values()) {
      delete doc.likec4ProjectId
      if (isLikeC4UserDocument(doc) && !this.projectsManager.isExcluded(doc)) {
        uris.push(doc.uri)
      }
    }
    return uris
  }
}

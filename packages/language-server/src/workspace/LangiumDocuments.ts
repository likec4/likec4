import type { NonEmptyArray, ProjectId } from '@likec4/core'
import type { LangiumDocument, Stream, URI } from 'langium'
import { DefaultLangiumDocuments, stream } from 'langium'
import { groupBy, map, pipe, prop } from 'remeda'
import { type LikeC4LangiumDocument, isLikeC4UserDocument } from '../ast'
import type { LikeC4SharedServices } from '../module'
import { compareByUri } from '../utils/compareByUri'
import type { ProjectsManager } from './ProjectsManager'

export class LangiumDocuments extends DefaultLangiumDocuments {
  constructor(protected override services: LikeC4SharedServices) {
    super(services)
  }

  protected get projectsManager(): ProjectsManager {
    return this.services.workspace.ProjectsManager
  }

  /**
   * Documents sorted by URI (natural hierarchical order), lazily computed.
   * Langium's trie keeps tree order, but model building relies on stable URI order.
   */
  private sortedDocuments: LangiumDocument[] | null = null

  private get sorted(): readonly LangiumDocument[] {
    return this.sortedDocuments ??= this.documentTrie.all().sort(compareByUri)
  }

  override addDocument(document: LangiumDocument): void {
    if (isLikeC4UserDocument(document)) {
      // Set project ID
      document.likec4ProjectId = this.projectsManager.ownerProjectId(document)
    }
    super.addDocument(document)
    this.sortedDocuments = null
  }

  override deleteDocument(uri: URI): LangiumDocument | undefined {
    this.sortedDocuments = null
    return super.deleteDocument(uri)
  }

  override deleteDocuments(folder: URI): LangiumDocument[] {
    this.sortedDocuments = null
    return super.deleteDocuments(folder)
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
    return stream(this.sorted)
      .filter((doc): doc is LikeC4LangiumDocument => isLikeC4UserDocument(doc) && !this.projectsManager.isExcluded(doc))
  }
  /**
   * Returns all documents (ensures project IDs are set)
   */
  override get all(): Stream<LangiumDocument> {
    return stream(this.sorted).map((doc) => {
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
    return stream(this.sorted)
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
    for (const doc of this.sorted) {
      delete doc.likec4ProjectId
      if (isLikeC4UserDocument(doc) && !this.projectsManager.isExcluded(doc)) {
        uris.push(doc.uri)
      }
    }
    return uris
  }
}

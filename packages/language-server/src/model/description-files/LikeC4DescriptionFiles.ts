import { type NonEmptyArray, ProjectId } from '@likec4/core/types'
import { difference, objectHash, stringHash } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import { Disposable, DocumentState, Emitter, SimpleCache, URI } from 'langium'

import { forEach, forEachObj, groupBy, map, mapValues, pipe, prop, reduce, unique } from 'remeda'
import type { Tagged } from 'type-fest'
import { type FileEvent, FileChangeType } from 'vscode-languageserver-protocol'
import type {
  LikeC4LangiumDocument,
  ParsedLikeC4LangiumDocument,
} from '../../ast'
import { logger as rootLogger } from '../../logger'
import type { LikeC4Services } from '../../module'
import { ADisposable } from '../../utils'

type DescriptionFileURI = Tagged<string, 'DescriptionFileURI'>
function toDescriptionFileURI(uri: string | URI): DescriptionFileURI {
  return URI.isUri(uri) ? uri.toString() as DescriptionFileURI : uri as DescriptionFileURI
}

type DocumentURI = Tagged<string, 'DocumentURI'>
function toDocumentURI(uri: URI | LikeC4LangiumDocument): DocumentURI {
  return URI.isUri(uri) ? uri.toString() as DocumentURI : uri.uri.toString() as DocumentURI
}

const descriptionFilesLogger = rootLogger.getChild('description-files')

type DidDescriptionFileUpdated = {
  readonly projectId: ProjectId
  /**
   * URIs of documents that reference the updated files
   */
  readonly docs: URI[]
}

type DescriptionFile =
  /**
   * File was not read yet
   */
  | {
    readonly uri: URI
    readonly referencedBy: Set<DocumentURI>
    readonly content?: never
    readonly hash?: never
  }
  /**
   * File was read and content is available
   */
  | {
    readonly uri: URI
    readonly referencedBy: Set<DocumentURI>
    readonly content: { readonly md: string }
    readonly hash: string
  }
  /**
   * File failed to read or parse
   */
  | {
    readonly uri: URI
    readonly referencedBy: Set<DocumentURI>
    readonly content: { readonly error: string }
    readonly hash?: never
  }

type DescriptionFileWithErrorContent = Extract<DescriptionFile, { content: { readonly error: string } }>
type DescriptionFileWithMarkdownContent = Extract<DescriptionFile, { content: { readonly md: string } }>
type DescriptionFileWithAnyContent = DescriptionFileWithErrorContent | DescriptionFileWithMarkdownContent

function hasBeenRead(file: DescriptionFile): file is DescriptionFileWithAnyContent {
  return 'content' in file
}
function hasContent(file: DescriptionFile): file is DescriptionFileWithMarkdownContent {
  return hasBeenRead(file) && 'md' in file.content
}
function hasError(file: DescriptionFile): file is DescriptionFileWithErrorContent {
  return hasBeenRead(file) && 'error' in file.content
}

/**
 * The content of the files referenced by `descriptionFile`.
 *
 * The parser only records the references. A file is read (synchronously) when its content is first
 * needed - by the validation, or when the model is built - and stays cached until it changes on disk
 * or no document references it anymore, so editing a document does not read its files again.
 *
 * A file is only read when it is inside the workspace: the path comes from the DSL, and must not
 * be able to pull in an arbitrary file of the machine. It may belong to another project of the
 * workspace, and symbolic links are not resolved: a link inside the workspace is followed wherever
 * it points to.
 */
export class LikeC4DescriptionFiles extends ADisposable {
  protected files = new Map<DescriptionFileURI, DescriptionFile>()

  /**
   * Per document, the files it references (keyed by the normalized URI).
   */
  protected docReferences = new SimpleCache<DocumentURI, {
    descriptionFiles: Set<DescriptionFileURI>
    // hash?: string
  }>()

  private descriptionFileUpdatedEmitter: Emitter<DidDescriptionFileUpdated>

  constructor(private services: LikeC4Services) {
    super()
    // Disposing drops the listeners too: a listener registered by a disposed service can never be
    // unsubscribed. A cache clear is not a disposal — `onForceCleanCache` clears the caches while the
    // services keep running, and the model builder does not register its listener a second time.
    //
    // The caches are not cleared when the projects are updated: nothing here is kept per project
    // (the owner of a document is asked when a file changes), and only the documents of the updated
    // project are parsed again - the files of the other projects would not be followed anymore.
    this.onDispose(
      Disposable.create(() => {
        this.clearCaches()
      }),
      this.docReferences,
      this.descriptionFileUpdatedEmitter = new Emitter<DidDescriptionFileUpdated>(),
      // Forget the references of a document when it is unlinked: they are recorded again when it is parsed
      services.shared.workspace.DocumentBuilder.onDocumentResetBelow(
        DocumentState.Linked,
        ({ doc }) => {
          this.clearDocumentReferences(toDocumentURI(doc))
        },
      ),
      services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
        this.clearCaches()
      }),
      services.likec4.ModelParser.onDocumentParsed(({ doc }) => {
        this.processDocumentReferences(doc)
      }),
      services.shared.lsp.DocumentUpdateHandler.onWatchedFilesChangeBy(
        ({ uri }) => this.files.has(toDescriptionFileURI(uri)),
        (changes) => this.onDescriptionFilesChange(changes),
      ),
      services.shared.workspace.DocumentBuilder.onUpdate(
        (_, deleted) => {
          forEach(deleted, (uri) => {
            this.clearDocumentReferences(toDocumentURI(uri))
          })
        },
      ),
    )
  }

  clearCaches(): void {
    if (this.#cleanupTimer) {
      clearTimeout(this.#cleanupTimer)
      this.#cleanupTimer = undefined
    }
    this.files.clear()
    this.docReferences.clear()
  }

  /**
   * Check if a description file is referenced by any document
   */
  public isReferenced(ref: DescriptionFileURI | URI): boolean {
    return (this.files.get(toDescriptionFileURI(ref))?.referencedBy.size ?? 0) > 0
  }

  /**
   * Hash of the files the document references and their content (the files are read, if not yet).
   * Changes when a referenced file changes, so the model built from the document is not taken from cache.
   */
  public hashReferences(doc: ParsedLikeC4LangiumDocument): string {
    if (doc.c4DescriptionFiles.size === 0) {
      return '<no-references>'
    }
    // The caches may have been cleared since the document was parsed (see `clearCaches`):
    // makes sure the document is tracked as referencing its files, the same way as when it is parsed
    this.processDocumentReferences(doc)

    const refs = pipe(
      [...doc.c4DescriptionFiles],
      reduce((acc, desc) => {
        const file = this.read(toDescriptionFileURI(desc))
        if (file.hash) {
          acc[desc] = file.hash
        }
        return acc
      }, {
        '_count': doc.c4DescriptionFiles.size.toString(),
      } as Record<string, string>),
    )
    return objectHash(refs)
  }

  /**
   * Reads the markdown content of a description file.
   * @param ref The reference to the description file.
   * @returns The markdown content of the description file, or undefined if the file could not be read.
   */
  readMarkdown(ref: string | null | undefined): { readonly md: string } | undefined {
    if (!ref) {
      return undefined
    }
    try {
      const file = this.read(toDescriptionFileURI(ref))
      return file && hasContent(file) ? file.content : undefined
    } catch (e) {
      descriptionFilesLogger.warn(`Failed to read description file ${ref}`, { error: e })
      return undefined
    }
  }

  /**
   * A referenced file changed (or was deleted) on disk: it is read again on the next build,
   * and the projects that reference it are notified to be rebuilt.
   */
  protected onDescriptionFilesChange(changes: NonEmptyArray<FileEvent>): void {
    const hotify = [] as { projectId: ProjectId; doc: DocumentURI }[]
    // First drop cached content for changed files
    for (const change of changes) {
      const uri = toDescriptionFileURI(change.uri)
      const file = this.files.get(uri)
      if (!file) {
        continue
      }
      for (const doc of file.referencedBy) {
        hotify.push({
          projectId: this.services.shared.workspace.ProjectsManager.ownerProjectId(doc),
          doc: doc,
        })
      }
      // Clear cache entry
      this.files.delete(uri)

      // getFile will recreate the entry, but without referencedBy tracking
      // so we need to restore it
      if (change.type !== FileChangeType.Deleted) {
        Object.assign(this.getFile(uri), {
          referencedBy: file.referencedBy,
        })
      }
    }
    pipe(
      hotify,
      groupBy(prop('projectId')),
      mapValues((items) =>
        unique(
          items.map((item) => item.doc),
        )
      ),
      forEachObj((docs, projectId) => {
        try {
          this.descriptionFileUpdatedEmitter.fire({
            projectId,
            docs: map(docs, (doc) => URI.parse(doc)),
          })
        } catch (error) {
          descriptionFilesLogger.warn(`Failed to notify about changed description files of ${projectId}`, { error })
        }
      }),
    )
  }

  public get onDescriptionFileUpdate() {
    return this.descriptionFileUpdatedEmitter.event
  }

  protected clearDocumentReferences(docUri: DocumentURI): void {
    if (!this.docReferences.has(docUri)) {
      return
    }
    // Remove any existing references from this document
    this.docReferences.get(docUri)?.descriptionFiles.forEach((uri) => {
      this.clearReferencedBy(uri, docUri)
    })
    this.docReferences.delete(docUri)
  }

  protected clearReferencedBy(descriptionFileUri: DescriptionFileURI, docUri: DocumentURI): void {
    const file = this.files.get(descriptionFileUri)
    if (file && file.referencedBy.has(docUri)) {
      file.referencedBy.delete(docUri)
      if (file.referencedBy.size === 0) {
        this.scheduleCleanup()
      }
    }
  }

  protected processDocumentReferences(doc: ParsedLikeC4LangiumDocument): void {
    const docUri = toDocumentURI(doc)
    if (doc.c4DescriptionFiles.size === 0) {
      this.clearDocumentReferences(docUri)
      return
    }
    const descriptionFiles = doc.c4DescriptionFiles as Set<DescriptionFileURI>
    const current = this.docReferences.get(docUri)?.descriptionFiles

    if (current && current !== descriptionFiles) {
      // Clear removed references
      difference(current, descriptionFiles).forEach((uri) => {
        this.clearReferencedBy(uri, docUri)
      })
    }

    // Also when the references are the same: the entry of a file is created anew (without the
    // documents referencing it) after the file was deleted on disk
    for (const uri of descriptionFiles) {
      try {
        // this side effect ensures that the file is created in the cache
        this.getFile(uri).referencedBy.add(docUri)
      } catch (error) {
        descriptionFilesLogger.warn(loggable(error))
      }
    }
    this.docReferences.set(docUri, { descriptionFiles })
  }

  public getFile(_ref: DescriptionFileURI | URI): DescriptionFile {
    const ref = toDescriptionFileURI(_ref)
    let file = this.files.get(ref)
    if (!file) {
      const uri = URI.parse(ref)
      const isInsideWorkspace = this.services.shared.workspace.WorkspaceManager.isInsideWorkspace(uri)
      if (!isInsideWorkspace) {
        file = {
          uri,
          referencedBy: new Set(),
          content: {
            error: `File "${ref}" is outside of the workspace`,
          },
        }
      } else {
        file = { uri, referencedBy: new Set() }
      }
      this.files.set(ref, file)
    }
    return file
  }

  /**
   * Reads the content of a description file.
   * @param ref The URI of the description file to read.
   * @returns The file with its content, or with the error when it is outside of the workspace or cannot be read.
   * The result is cached until the file changes on disk.
   */
  public read(_ref: DescriptionFileURI | URI): DescriptionFileWithAnyContent {
    const ref = toDescriptionFileURI(_ref)
    const file = this.getFile(ref)
    if (hasBeenRead(file)) {
      return file
    }
    const content = this.readContent(file)
    this.files.set(ref, content)
    return content
  }

  protected readContent(file: DescriptionFile): DescriptionFileWithAnyContent {
    try {
      const md = this.services.shared.workspace.FileSystemProvider.readFileSync(file.uri)
      return {
        uri: file.uri,
        referencedBy: file.referencedBy,
        content: { md },
        hash: stringHash(md || '<empty>'),
      }
    } catch (error) {
      return {
        uri: file.uri,
        referencedBy: file.referencedBy,
        content: {
          // Only the message: it is reported as a diagnostic, where a stack trace does not belong
          error: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  /**
   * Schedules cleanup of unreferenced description files.
   */
  #cleanupTimer: NodeJS.Timeout | undefined
  private scheduleCleanup() {
    if (this.#cleanupTimer) {
      clearTimeout(this.#cleanupTimer)
    }
    this.#cleanupTimer = setTimeout(() => {
      this.#cleanupTimer = undefined
      this.cleanup()
    }, 5000).unref()
  }

  private cleanup() {
    for (const [uri, file] of [...this.files.entries()]) {
      if (file.referencedBy.size === 0) {
        descriptionFilesLogger.trace(`Cleaning up unreferenced description file: ${uri}`)
        this.files.delete(uri)
      }
    }
  }

  public readonly hasContent = hasContent
  public readonly hasError = hasError
}

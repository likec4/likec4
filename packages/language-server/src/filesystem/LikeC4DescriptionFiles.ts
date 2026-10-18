import { onNextTick } from '@likec4/core/utils'
import { Disposable, URI, UriUtils } from 'langium'
import { entries, groupBy, uniqueBy } from 'remeda'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { ADisposable, safeCall } from '../utils'
import type {
  DescriptionFileContent,
  DescriptionFileReference,
  DescriptionFileUpdateEvent,
  DescriptionFileUpdateListener,
  LikeC4DescriptionFiles,
} from './types'

const descriptionFilesLogger = rootLogger.getChild('description-files')

type DescriptionFile = {
  /** Missing when the path must not be read at all (outside of the project, another scheme, ...) */
  readonly resolved?: URI
  readonly content: DescriptionFileContent
}

/**
 * Whether `path` is inside `folder`, both being file system paths.
 *
 * The comparison is made on the decoded segments: a percent-encoded separator (`%2f`) is invisible to
 * the URL normalization, so `..%2f..%2fsecret.txt` would otherwise reach a file outside the project.
 * Any `.` or `..` segment left is refused for the same reason.
 *
 * The check is lexical: a path that is inside the project but is a symbolic link to a file outside it
 * passes here, which is why the caller checks the canonical paths too (`escapesProject`).
 */
function isInsideProject(folder: string, path: string): boolean {
  const toSegments = (value: string) => value.replace(/\\/g, '/').split('/')
  const folderSegments = toSegments(folder.replace(/[\\/]+$/, ''))
  const segments = toSegments(path)
  if (segments.some(segment => segment === '.' || segment === '..')) {
    return false
  }
  return segments.length > folderSegments.length
    && folderSegments.every((segment, index) => segments[index] === segment)
}

/**
 * The content of the files referenced by `descriptionFile`.
 *
 * The parser is synchronous, so it cannot read them while it parses, and the files are read when the
 * model is built - not while documents are parsed, which keeps a workspace that is only parsed free
 * of file reads. A parsed entity holds the reference to its file until then, and is parsed again when
 * the content arrives.
 *
 * A file is only read when it is inside the project folder: the path comes from the DSL, and must not
 * be able to pull in an arbitrary file of the machine (the rule the icon paths already follow).
 */
export class DefaultLikeC4DescriptionFiles extends ADisposable implements LikeC4DescriptionFiles {
  /**
   * Per document, the files it references, keyed by the path as written in the DSL.
   */
  protected files = new Map<string, Map<string, DescriptionFile>>()

  /**
   * The documents whose files were read (or changed on disk) after they were parsed last.
   */
  private stale = new Set<string>()

  private listeners: DescriptionFileUpdateListener[] = []

  constructor(private services: LikeC4SharedServices) {
    super()
    // Disposing drops the listeners too: a listener registered by a disposed service can never be
    // unsubscribed. A cache clear is not a disposal — `onProjectsUpdate` clears the caches while the
    // services keep running, and the model builder does not register its listener a second time.
    this.onDispose(Disposable.create(() => {
      this.files.clear()
      this.stale.clear()
      this.listeners.length = 0
    }))

    onNextTick(() => {
      this.onDispose(
        services.workspace.ProjectsManager.onProjectsUpdate(() => this.clearCaches()),
      )
    })
  }

  clearCaches(): void {
    this.files.clear()
    this.stale.clear()
  }

  get(docUri: URI, value: string): DescriptionFileContent | undefined {
    return this.files.get(docUri.toString())?.get(value)?.content
  }

  isReferenced(uri: URI): boolean {
    for (const files of this.files.values()) {
      for (const file of files.values()) {
        if (file.resolved && UriUtils.equals(file.resolved, uri)) {
          return true
        }
      }
    }
    return false
  }

  onDescriptionFileUpdate(listener: DescriptionFileUpdateListener): Disposable {
    this.listeners.push(listener)
    return Disposable.create(() => {
      const index = this.listeners.indexOf(listener)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    })
  }

  /**
   * Reads the files the given references point to, and returns the documents whose content was read
   * or changed since the last call, so the parser can resolve them into descriptions.
   */
  async read(refs: readonly DescriptionFileReference[]): Promise<URI[]> {
    const changed: URI[] = []
    for (const [docUri, references] of entries(groupBy(refs, ref => ref.docUri.toString()))) {
      const unique = uniqueBy(references, ref => ref.value)
      const cached = this.files.get(docUri)
      // A document that references the same files as the last time keeps what was read then: the
      // watcher re-reads a file that changes on disk, and a project update clears the caches.
      if (!cached || cached.size !== unique.length || unique.some(ref => !cached.has(ref.value))) {
        const files = new Map<string, DescriptionFile>()
        for (const ref of unique) {
          const file = await this.loadFile(ref)
          this.watchFile(file.resolved)
          files.set(ref.value, file)
        }
        this.files.set(docUri, files)
        this.stale.add(docUri)
      }
      if (this.stale.delete(docUri)) {
        changed.push(unique[0]!.docUri)
      }
    }
    return changed
  }

  /**
   * Resolves and reads a single reference, and remembers the result for the parser.
   */
  async readReference(ref: DescriptionFileReference): Promise<DescriptionFileContent> {
    const file = await this.loadFile(ref)
    this.watchFile(file.resolved)
    this.store(ref, file)
    return file.content
  }

  private store(ref: DescriptionFileReference, file: DescriptionFile): void {
    const docUri = ref.docUri.toString()
    const files = this.files.get(docUri) ?? new Map<string, DescriptionFile>()
    files.set(ref.value, file)
    this.files.set(docUri, files)
    this.stale.add(docUri)
  }

  /**
   * Lets the file system watcher follow a resolved description file.
   *
   * The watcher decides which files it follows while it scans, so a file that was not a reference yet
   * is not tracked afterwards and its edits produce no events. `watch` re-evaluates that decision for
   * the path it is given, which is how a file that is already on disk starts being followed.
   */
  private watchFile(resolved: URI | undefined): void {
    if (!resolved || resolved.scheme !== 'file') {
      return
    }
    this.services.workspace.FileSystemWatcher?.watch(resolved.fsPath)
  }

  /**
   * Re-reads (or forgets) the referenced files after one of them changed on disk, and notifies the
   * listeners so the model is rebuilt.
   */
  async handleFileSystemUpdate(
    event: { update: URI; delete?: never } | { delete: URI; update?: never },
  ): Promise<void> {
    const uri = event.update ?? event.delete
    const projects = new Set<string>()
    for (const [docUri, files] of [...this.files]) {
      for (const [value, file] of [...files]) {
        if (!file.resolved || !UriUtils.equals(file.resolved, uri)) {
          continue
        }
        const ref: DescriptionFileReference = { docUri: URI.parse(docUri), value, resolvedPath: uri.toString() }
        this.store(ref, await this.loadFile(ref))
        projects.add(this.services.workspace.ProjectsManager.ownerProjectId(docUri))
      }
    }
    for (const projectId of projects) {
      this.triggerUpdate({
        uri,
        projectId: projectId as DescriptionFileUpdateEvent['projectId'],
      })
    }
  }

  protected async loadFile(ref: DescriptionFileReference): Promise<DescriptionFile> {
    // A value that names another scheme (`https:`, `file:`, `C:`) is not a file of this project,
    // and the parser refuses to resolve it
    if (!ref.resolvedPath) {
      return { content: { error: `File "${ref.value}" is not part of the project` } }
    }
    const resolved = URI.parse(ref.resolvedPath)
    const projects = this.services.workspace.ProjectsManager
    const project = projects.getProject(projects.ownerProjectId(ref.docUri))
    // The file must be of the project's own scheme: a document from another scheme is refused,
    // while a project on a non-`file:` scheme (VS Code Remote, a virtual provider) reads through
    // its own provider, which is the file system there.
    if (resolved.scheme !== project.folderUri.scheme) {
      return { content: { error: `File "${ref.value}" is not part of the project` } }
    }
    if (!isInsideProject(project.folderUri.fsPath, resolved.fsPath)) {
      return { content: { error: `File "${ref.value}" is outside of the project` } }
    }
    const escaped = await this.escapesProject(project.folderUri, resolved)
    if (escaped) {
      return { content: { error: `File "${ref.value}" is outside of the project` } }
    }
    try {
      const content = await this.services.workspace.FileSystemProvider.readFile(resolved)
      // The file system provider answers an empty string both for an empty file and for one it
      // cannot read, and it does not tell them apart
      if (content.trim() === '') {
        return { resolved, content: { error: `File "${ref.value}" does not exist or cannot be read` } }
      }
      return { resolved, content: { content } }
    } catch (err) {
      descriptionFilesLogger.warn(`Failed to read description file ${resolved.toString()}`, { err })
      return { resolved, content: { error: `Failed to read file "${ref.value}"` } }
    }
  }

  /**
   * Whether the file leaves the project once symbolic links are followed.
   *
   * The containment check is lexical and the file system provider follows symbolic links on purpose
   * (#1213), so a file written as `link.md` and living inside the project can point at a file outside
   * it and have it read and rendered. Both paths are canonicalized — the project root as well, because
   * the root itself can be behind a link (on macOS `/tmp` is `/private/tmp`) and comparing a canonical
   * path with a lexical one would refuse the project's own files.
   *
   * `false` when either path cannot be canonicalized: a file that does not exist is then reported by
   * the read, which is the message the user expects.
   */
  protected async escapesProject(folderUri: URI, resolved: URI): Promise<boolean> {
    const { FileSystemProvider } = this.services.workspace
    const [realFolder, realFile] = await Promise.all([
      FileSystemProvider.realpath(folderUri),
      FileSystemProvider.realpath(resolved),
    ])
    if (!realFolder || !realFile) {
      return false
    }
    return !isInsideProject(realFolder, realFile)
  }

  private triggerUpdate(event: DescriptionFileUpdateEvent): void {
    for (const listener of [...this.listeners]) {
      safeCall(() => listener(event))
    }
  }
}

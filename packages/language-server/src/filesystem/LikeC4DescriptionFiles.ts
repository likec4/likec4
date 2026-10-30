import type { ProjectId } from '@likec4/core/types'
import { compareNatural, onNextTick, stringHash } from '@likec4/core/utils'
import { Disposable, URI } from 'langium'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { ADisposable, safeCall } from '../utils'
import type { Project } from '../workspace/ProjectsManager'
import type {
  DescriptionFileContent,
  DescriptionFileReference,
  DescriptionFileUpdateEvent,
  DescriptionFileUpdateListener,
  LikeC4DescriptionFiles,
} from './types'

const descriptionFilesLogger = rootLogger.getChild('description-files')

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
 * The parser only records the references, and the files are read when the model is built - not while
 * documents are parsed, which keeps a workspace that is only parsed free of file reads.
 * The model builder reads the files of the project before the (synchronous) build, and the build
 * takes their content from here.
 *
 * A file is only read when it is inside the project folder: the path comes from the DSL, and must not
 * be able to pull in an arbitrary file of the machine (the rule the icon paths already follow).
 */
export class DefaultLikeC4DescriptionFiles extends ADisposable implements LikeC4DescriptionFiles {
  /**
   * Per project, the files it references (keyed by the normalized URI).
   * `null` when the file is referenced, but not read yet (or changed on disk since it was read).
   */
  protected files = new Map<ProjectId, Map<string, DescriptionFileContent | null>>()

  /**
   * Per project, the hash of the referenced files and their content (computed lazily)
   */
  private hashes = new Map<ProjectId, string>()

  /**
   * Incremented on every change on disk: a read that started before the change does not store
   * what it read (it may be stale), the next build reads the file again.
   */
  private generation = 0

  private listeners: DescriptionFileUpdateListener[] = []

  constructor(private services: LikeC4SharedServices) {
    super()
    // Disposing drops the listeners too: a listener registered by a disposed service can never be
    // unsubscribed. A cache clear is not a disposal — `onProjectsUpdate` clears the caches while the
    // services keep running, and the model builder does not register its listener a second time.
    this.onDispose(Disposable.create(() => {
      this.clearCaches()
      this.listeners.length = 0
    }))

    onNextTick(() => {
      this.onDispose(
        services.workspace.ProjectsManager.onProjectsUpdate(() => this.clearCaches()),
        services.lsp.DocumentUpdateHandler.onWatchedFilesChangeBy(
          ({ uri }) => this.isReferenced(URI.parse(uri)),
          (changes) => {
            for (const change of changes) {
              this.onReferencedFileChange(URI.parse(change.uri))
            }
          },
        ),
      )
    })
  }

  clearCaches(): void {
    this.generation++
    this.files.clear()
    this.hashes.clear()
  }

  async read(projectId: ProjectId, resolvedPaths: Iterable<string>): Promise<void> {
    const referenced = new Set<string>()
    for (const path of resolvedPaths) {
      referenced.add(normalize(path))
    }
    let files = this.files.get(projectId)
    if (!files) {
      if (referenced.size === 0) {
        return
      }
      files = new Map()
      this.files.set(projectId, files)
    }
    // Forget the files the project does not reference anymore
    // Deleting entries of a Map while iterating it is safe
    for (const key of files.keys()) {
      if (!referenced.has(key)) {
        files.delete(key)
        this.hashes.delete(projectId)
      }
    }
    const project = this.services.workspace.ProjectsManager.getProject(projectId)
    for (const key of referenced) {
      if (files.get(key)) {
        continue
      }
      const generation = this.generation
      const resolved = URI.parse(key)
      this.watchFile(resolved)
      const content = await this.loadFile(project, resolved, this.relativePath(project, resolved))
      // A change on disk happened while reading, what was read may be stale
      if (generation !== this.generation) {
        files.set(key, null)
        continue
      }
      files.set(key, content)
      this.hashes.delete(projectId)
    }
  }

  get(projectId: ProjectId, resolvedPath: string): DescriptionFileContent | undefined {
    return this.files.get(projectId)?.get(normalize(resolvedPath)) ?? undefined
  }

  hash(projectId: ProjectId): string {
    const files = this.files.get(projectId)
    if (!files || files.size === 0) {
      return ''
    }
    let hash = this.hashes.get(projectId)
    if (hash === undefined) {
      const keys = [...files.keys()].sort(compareNatural)
      hash = stringHash(
        keys
          .map(key => {
            const file = files.get(key)
            return key + ':' + (file ? ('content' in file ? file.content : file.error) : '')
          })
          .join('\n'),
      )
      this.hashes.set(projectId, hash)
    }
    return hash
  }

  isReferenced(uri: URI): boolean {
    const key = uri.toString()
    for (const files of this.files.values()) {
      if (files.has(key)) {
        return true
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
   * Resolves and reads a single reference.
   */
  async readReference(ref: DescriptionFileReference): Promise<DescriptionFileContent> {
    // A value that names another scheme (`https:`, `file:`, `C:`) is not a file of this project,
    // and the parser refuses to resolve it
    if (!ref.resolvedPath) {
      return { error: `File "${ref.value}" is not part of the project` }
    }
    const projects = this.services.workspace.ProjectsManager
    const project = projects.getProject(projects.ownerProjectId(ref.docUri))
    const resolved = URI.parse(ref.resolvedPath)
    this.watchFile(resolved)
    return await this.loadFile(project, resolved, ref.value)
  }

  /**
   * Lets the file system watcher follow a resolved description file.
   *
   * The watcher decides which files it follows while it scans, so a file that was not a reference yet
   * is not tracked afterwards and its edits produce no events. `watch` re-evaluates that decision for
   * the path it is given, which is how a file that is already on disk starts being followed.
   */
  private watchFile(resolved: URI): void {
    if (resolved.scheme !== 'file') {
      return
    }
    this.services.workspace.FileSystemWatcher?.watch(resolved.fsPath)
  }

  /**
   * A referenced file changed (or was deleted) on disk: it is read again on the next build,
   * and the projects that reference it are notified to be rebuilt.
   */
  protected onReferencedFileChange(uri: URI): void {
    const key = uri.toString()
    this.generation++
    for (const [projectId, files] of this.files) {
      if (!files.has(key)) {
        continue
      }
      files.set(key, null)
      this.hashes.delete(projectId)
      descriptionFilesLogger.debug`description file changed: ${uri.fsPath} (project ${projectId})`
      this.triggerUpdate({ uri, projectId })
    }
  }

  private relativePath(project: Project, resolved: URI): string {
    const folder = project.folderUri.toString().replace(/\/?$/, '/')
    const path = resolved.toString()
    return path.startsWith(folder) ? decodeURIComponent(path.slice(folder.length)) : resolved.fsPath
  }

  protected async loadFile(project: Project, resolved: URI, value: string): Promise<DescriptionFileContent> {
    // The file must be of the project's own scheme: a document from another scheme is refused,
    // while a project on a non-`file:` scheme (VS Code Remote, a virtual provider) reads through
    // its own provider, which is the file system there.
    if (resolved.scheme !== project.folderUri.scheme) {
      return { error: `File "${value}" is not part of the project` }
    }
    if (!isInsideProject(project.folderUri.fsPath, resolved.fsPath)) {
      return { error: `File "${value}" is outside of the project` }
    }
    const escaped = await this.escapesProject(project.folderUri, resolved)
    if (escaped) {
      return { error: `File "${value}" is outside of the project` }
    }
    try {
      const content = await this.services.workspace.FileSystemProvider.readFile(resolved)
      // The file system provider answers an empty string both for an empty file and for one it
      // cannot read, and it does not tell them apart
      if (content.trim() === '') {
        return { error: `File "${value}" does not exist or cannot be read` }
      }
      return { content }
    } catch (err) {
      descriptionFilesLogger.warn(`Failed to read description file ${resolved.toString()}`, { err })
      return { error: `Failed to read file "${value}"` }
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

/**
 * Same file is referenced with the same key (resolved paths and watched changes may differ in encoding)
 */
function normalize(path: string): string {
  return URI.parse(path).toString()
}

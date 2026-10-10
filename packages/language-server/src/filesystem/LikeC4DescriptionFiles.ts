import { onNextTick } from '@likec4/core/utils'
import { type AstNode, type LangiumDocument, AstUtils, Disposable, DocumentState, URI, UriUtils } from 'langium'
import { isTruthy, unique } from 'remeda'
import { ast, isLikeC4LangiumDocument, parseMarkdownAsString } from '../ast'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { ADisposable, safeCall } from '../utils'
import type {
  DescriptionFileContent,
  DescriptionFileUpdateEvent,
  DescriptionFileUpdateListener,
  LikeC4DescriptionFiles,
} from './types'

const descriptionFilesLogger = rootLogger.getChild('description-files')

/** A path that names another scheme (`https:`, `file:`, `C:`) is not a file of this project */
const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/

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
 * The check is lexical. The file system provider follows symbolic links on purpose (see #1213), so a
 * symlink inside the project can still point outside it; closing that needs a real-path check in the
 * provider rather than here.
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
 * The model parser is synchronous, and it parses a document as soon as it is linked, so the content of
 * a file referenced by `descriptionFile` cannot be read while the property is parsed. The files are
 * read on the `Parsed` document phase instead, and the parser looks the content up by the path the
 * document names.
 *
 * A file is only read when it is inside the project folder: the path comes from the DSL, and must not
 * be able to pull in an arbitrary file of the machine (the rule the icon paths already follow).
 */
export class DefaultLikeC4DescriptionFiles extends ADisposable implements LikeC4DescriptionFiles {
  /**
   * Per document, the files it references, keyed by the path as written in the DSL.
   */
  protected files = new Map<string, Map<string, DescriptionFile>>()

  private listeners: DescriptionFileUpdateListener[] = []

  constructor(private services: LikeC4SharedServices) {
    super()
    this.onDispose(Disposable.create(() => this.clearCaches()))

    onNextTick(() => {
      this.onDispose(
        services.workspace.DocumentBuilder.onBuildPhase(DocumentState.Parsed, async (docs) => {
          await this.read(docs)
        }),
        services.workspace.ProjectsManager.onProjectsUpdate(() => this.clearCaches()),
      )
    })
  }

  clearCaches(): void {
    this.files.clear()
    this.listeners.length = 0
  }

  get(docUri: URI, path: string): DescriptionFileContent | undefined {
    return this.files.get(docUri.toString())?.get(path)?.content
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
   * Reads every file referenced by `descriptionFile` in the given documents, so the synchronous
   * parser can resolve them.
   */
  async read(docs: LangiumDocument[]): Promise<void> {
    for (const doc of docs) {
      if (!isLikeC4LangiumDocument(doc) || !doc.parseResult) {
        continue
      }
      try {
        const files = new Map<string, DescriptionFile>()
        for (const path of this.referencedPaths(doc)) {
          files.set(path, await this.loadFile(doc.uri, path))
        }
        if (files.size === 0) {
          this.files.delete(doc.uri.toString())
        } else {
          this.files.set(doc.uri.toString(), files)
        }
      } catch (err) {
        // Never break the document build: without an entry the description is simply not resolved
        descriptionFilesLogger.warn(`Failed to read the files referenced by ${doc.uri.toString()}`, { err })
      }
    }
  }

  /**
   * Resolves and reads a single file, and remembers the result for the parser.
   */
  async readFile(doc: LangiumDocument, path: string): Promise<DescriptionFileContent> {
    const file = await this.loadFile(doc.uri, path)
    const files = this.files.get(doc.uri.toString()) ?? new Map()
    files.set(path, file)
    this.files.set(doc.uri.toString(), files)
    return file.content
  }

  /**
   * Re-reads (or forgets) a referenced file after it changed on disk, and notifies the listeners so
   * the model is rebuilt.
   */
  async handleFileSystemUpdate(
    event: { update: URI; delete?: never } | { delete: URI; update?: never },
  ): Promise<void> {
    const uri = event.update ?? event.delete
    const projects = new Set<string>()
    for (const [docUri, files] of [...this.files]) {
      for (const [path, file] of [...files]) {
        if (!file.resolved || !UriUtils.equals(file.resolved, uri)) {
          continue
        }
        files.set(path, await this.loadFile(URI.parse(docUri), path))
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

  protected referencedPaths(doc: LangiumDocument): string[] {
    return unique(
      AstUtils.streamAst(doc.parseResult.value as AstNode)
        .filter(ast.isStringProperty)
        .filter(prop => prop.key === 'descriptionFile')
        .map(prop => ast.isMarkdownOrString(prop.value) ? parseMarkdownAsString(prop.value)?.trim() : undefined)
        .filter(isTruthy)
        .toArray(),
    )
  }

  protected async loadFile(docUri: URI, path: string): Promise<DescriptionFile> {
    const resolved = this.resolve(docUri, path)
    if (typeof resolved === 'string') {
      return { content: { error: resolved } }
    }
    try {
      const content = await this.services.workspace.FileSystemProvider.readFile(resolved)
      // The file system provider answers an empty string both for an empty file and for one it
      // cannot read, and it does not tell them apart
      if (content.trim() === '') {
        return { resolved, content: { error: `File "${path}" does not exist or cannot be read` } }
      }
      return { resolved, content: { content } }
    } catch (err) {
      descriptionFilesLogger.warn(`Failed to read description file ${resolved.toString()}`, { err })
      return { resolved, content: { error: `Failed to read file "${path}"` } }
    }
  }

  /**
   * Resolves the path against the document it appears in, and returns the URI to read,
   * or the error message when it must not be read.
   */
  protected resolve(docUri: URI, path: string): URI | string {
    if (SCHEME.test(path)) {
      return `File "${path}" is not part of the project`
    }
    let resolved: URI
    try {
      // The value is a path, not a URL: encode the segments so that `#`, `?` and `%` stay filename
      // characters, while a `..` is still resolved by the URL step
      const relative = path.split('/').map(encodeURIComponent).join('/')
      resolved = URI.parse(new URL(relative, docUri.toString()).toString())
    } catch {
      return `Failed to resolve file "${path}"`
    }
    const projects = this.services.workspace.ProjectsManager
    const project = projects.getProject(projects.ownerProjectId(docUri))
    if (resolved.scheme !== project.folderUri.scheme) {
      return `File "${path}" is not part of the project`
    }
    if (!isInsideProject(project.folderUri.fsPath, resolved.fsPath)) {
      return `File "${path}" is outside of the project`
    }
    return resolved
  }

  private triggerUpdate(event: DescriptionFileUpdateEvent): void {
    for (const listener of [...this.listeners]) {
      safeCall(() => listener(event))
    }
  }
}

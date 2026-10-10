import { onNextTick } from '@likec4/core/utils'
import { type AstNode, type LangiumDocument, AstUtils, Disposable, DocumentState, URI } from 'langium'
import { isTruthy, unique } from 'remeda'
import { ast, isLikeC4LangiumDocument, parseMarkdownAsString } from '../ast'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { ADisposable } from '../utils'
import type { DescriptionFileContent, LikeC4DescriptionFiles } from './types'

const descriptionFilesLogger = rootLogger.getChild('description-files')

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
  protected cache = new Map<string, Map<string, DescriptionFileContent>>()

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
    this.cache.clear()
  }

  get(docUri: URI, path: string): DescriptionFileContent | undefined {
    return this.cache.get(docUri.toString())?.get(path)
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
        for (const path of this.referencedPaths(doc)) {
          await this.readFile(doc, path)
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
    const result = await this.load(doc, path)
    const files = this.cache.get(doc.uri.toString()) ?? new Map()
    files.set(path, result)
    this.cache.set(doc.uri.toString(), files)
    return result
  }

  protected referencedPaths(doc: LangiumDocument): string[] {
    return unique(
      AstUtils.streamAst(doc.parseResult.value as AstNode)
        .filter(ast.isStringProperty)
        .filter(prop => prop.key === 'descriptionFile')
        .map(prop => ast.isMarkdownOrString(prop.value) ? parseMarkdownAsString(prop.value) : undefined)
        .filter(isTruthy)
        .toArray(),
    )
  }

  protected async load(doc: LangiumDocument, path: string): Promise<DescriptionFileContent> {
    const resolved = this.resolve(doc, path)
    if (typeof resolved === 'string') {
      return { error: resolved }
    }
    try {
      const content = await this.services.workspace.FileSystemProvider.readFile(resolved)
      // The file system provider answers an empty string both for an empty file and for one it
      // cannot read, and it does not tell them apart
      if (content.trim() === '') {
        return { error: `File "${path}" does not exist or cannot be read` }
      }
      return { content }
    } catch (err) {
      descriptionFilesLogger.warn(`Failed to read description file ${resolved.toString()}`, { err })
      return { error: `Failed to read file "${path}"` }
    }
  }

  /**
   * Resolves the path against the document it appears in, and returns the URI to read,
   * or the error message when it must not be read.
   */
  protected resolve(doc: LangiumDocument, path: string): URI | string {
    let resolved: URI
    try {
      resolved = URI.parse(new URL(path, doc.uri.toString()).toString())
    } catch {
      return `Failed to resolve file "${path}"`
    }
    const projects = this.services.workspace.ProjectsManager
    const project = projects.getProject(projects.ownerProjectId(doc))
    if (resolved.scheme !== project.folderUri.scheme) {
      return `File "${path}" is not part of the project`
    }
    if (!isInsideProject(project.folderUri.fsPath, resolved.fsPath)) {
      return `File "${path}" is outside of the project`
    }
    return resolved
  }
}

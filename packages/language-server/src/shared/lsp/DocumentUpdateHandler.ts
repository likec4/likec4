import type { NonEmptyArray } from '@likec4/core'
import { DefaultDocumentUpdateHandler } from 'langium/lsp'
import { basename, extname } from 'pathe'
import { hasAtLeast } from 'remeda'
import { withTrailingSlash } from 'ufo'
import {
  type DidChangeWatchedFilesParams,
  type FileEvent,
  type FileSystemWatcher,
  type TextDocumentChangeEvent,
  Disposable,
} from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { hasLikeC4Ext, insideNodeModulesOrRepo } from '../../filesystem/utils'
import { LikeC4LanguageMetaData } from '../../generated/module'
import { logger } from '../../logger'
import type { LikeC4SharedServices } from '../../module'
import type { DocOrUri } from '../../workspace'

export class LikeC4DocumentUpdateHandler extends DefaultDocumentUpdateHandler {
  #logger = logger.getChild('document-updater')

  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  /**
   * Added to describe the flow explicitly
   * - IDE/Other editors call this method when they detect file changes
   * - Then {@link fireDocumentUpdate} is called (and we handle ONLY LikeC4 files)
   */
  override didChangeContent(change: TextDocumentChangeEvent<TextDocument>): void {
    if (this.#logger.isEnabledFor('trace')) {
      this.#logger.trace`didChangeContent ${change.document.uri}`
    }
    // Only handle LikeC4 files
    if (change.document.languageId === LikeC4LanguageMetaData.languageId) {
      if (this.isNotExcluded(change.document)) {
        super.didChangeContent(change)
      }
      return
    }
  }

  /**
   * Added to describe the flow explicitly
   * - Chokidar/IDE/Other watchers call this method when they detect file changes
   * - First it triggers {@link onWatchedFilesChangeEmitter} (THATS WHAT WE NEED - we have watchers with filters {@link onWatchedFilesChangeBy})
   * - Then {@link fireDocumentUpdate} is called (and we handle ONLY LikeC4 files)
   */
  override didChangeWatchedFiles(params: DidChangeWatchedFilesParams): void {
    if (this.#logger.isEnabledFor('trace')) {
      this.#logger.trace`didChangeWatchedFiles`
      params.changes.forEach(c => {
        this.#logger.trace`  - ${c.uri}`
      })
    }
    super.didChangeWatchedFiles(params)
  }

  /**
   * Force watching all file changes in the workspace (do not depend on langium updates)
   * Otherwise we miss changes from snapshots, project configs, etc.
   */
  protected override getWatchers(): FileSystemWatcher[] {
    return [{
      globPattern: '**/*',
    }]
  }

  protected override fireDocumentUpdate(changed: URI[], deleted: URI[]): void {
    const isLikeC4File = (uri: URI) => hasLikeC4Ext(basename(uri.path)) && this.isNotExcluded(uri)
    // Track only LikeC4 files and directories (when a directory is deleted or moved,
    // the client sends a single event for the directory, not for each file inside)
    const changedLikeC4 = changed.filter(isLikeC4File)
    const deletedLikeC4 = deleted.filter(uri => isLikeC4File(uri) || this.hasDocumentsIn(uri))
    const maybeDirectories = changed.filter(uri =>
      extname(uri.path) === '' && !insideNodeModulesOrRepo(uri.path) && this.isNotExcluded(uri)
    )
    if (maybeDirectories.length === 0) {
      if (changedLikeC4.length || deletedLikeC4.length) {
        super.fireDocumentUpdate(changedLikeC4, deletedLikeC4)
      }
      return
    }
    void this.filterDirectories(maybeDirectories).then(directories => {
      if (changedLikeC4.length || deletedLikeC4.length || directories.length) {
        super.fireDocumentUpdate([...changedLikeC4, ...directories], deletedLikeC4)
      }
    })
  }

  /**
   * Returns true if there are documents inside the given folder
   */
  protected hasDocumentsIn(folder: URI): boolean {
    const prefix = withTrailingSlash(folder.toString())
    return this.services.workspace.LangiumDocuments.all.some(doc => doc.uri.toString().startsWith(prefix))
  }

  protected async filterDirectories(uris: URI[]): Promise<URI[]> {
    const fs = this.services.workspace.FileSystemProvider
    const stats = await Promise.all(uris.map(uri => fs.stat(uri).catch(() => null)))
    return uris.filter((_, i) => stats[i]?.isDirectory === true)
  }

  /**
   * Subscribe to watched file changes that match the given filter.
   * Returns a disposable to unsubscribe.
   */
  onWatchedFilesChangeBy(
    filter: (uri: FileEvent) => boolean,
    listener: (changes: NonEmptyArray<FileEvent>) => void,
  ): Disposable {
    const isNotExcluded = (change: FileEvent) => this.isNotExcluded(change.uri)
    return this.onWatchedFilesChangeEmitter.event(({ changes }) => {
      const filtered = changes.filter(filter).filter(isNotExcluded)
      if (hasAtLeast(filtered, 1)) {
        listener(filtered)
      }
    })
  }

  protected isNotExcluded(uri: DocOrUri): boolean {
    return !this.services.workspace.ProjectsManager.isExcludedByWorkspace(uri)
  }
}

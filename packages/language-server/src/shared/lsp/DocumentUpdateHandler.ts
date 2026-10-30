import { DefaultDocumentUpdateHandler } from 'langium/lsp'
import { basename } from 'pathe'
import { type FileEvent, type FileSystemWatcher, type TextDocumentChangeEvent, Disposable } from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { hasLikeC4Ext } from '../../filesystem/utils'
import { LikeC4LanguageMetaData } from '../../generated/module'
import type { LikeC4SharedServices } from '../../module'

export class LikeC4DocumentUpdateHandler extends DefaultDocumentUpdateHandler {
  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  override didChangeContent(change: TextDocumentChangeEvent<TextDocument>): void {
    // Only handle LikeC4 files, let the parent class handle other file types
    if (
      change.document.languageId === LikeC4LanguageMetaData.languageId &&
      this.isNotExcluded(URI.parse(change.document.uri))
    ) {
      super.didChangeContent(change)
    }
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
    // Track only LikeC4 files
    const changedLikeC4 = changed.filter(isLikeC4File)
    const deletedLikeC4 = deleted.filter(isLikeC4File)
    if (changedLikeC4.length || deletedLikeC4.length) {
      super.fireDocumentUpdate(changedLikeC4, deletedLikeC4)
    }
  }

  /**
   * Subscribe to watched file changes that match the given filter.
   * Returns a disposable to unsubscribe.
   */
  onWatchedFilesChangeBy(filter: (uri: FileEvent) => boolean, listener: (changes: FileEvent[]) => void): Disposable {
    const isNotExcluded = (change: FileEvent) => this.isNotExcluded(URI.parse(change.uri))
    return this.onWatchedFilesChangeEmitter.event(({ changes }) => {
      const filtered = changes.filter(filter).filter(isNotExcluded)
      if (filtered.length > 0) {
        listener(filtered)
      }
    })
  }

  protected isNotExcluded(uri: URI): boolean {
    return !this.services.workspace.ProjectsManager.isExcludedByWorkspace(uri)
  }
}

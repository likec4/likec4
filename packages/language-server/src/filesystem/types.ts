import type { LikeC4ProjectConfig } from '@likec4/config'
import type { LayoutedView, ProjectId, ViewId } from '@likec4/core/types'
import type {
  AsyncDisposable,
  Disposable,
  FileSystemNode,
  FileSystemProvider as LangiumFileSystemProvider,
  LangiumDocument,
  URI,
} from 'langium'
import type { Location } from 'vscode-languageserver-types'
import type { LikeC4SharedServices } from '../module'
import type { Project } from '../workspace/ProjectsManager'

export interface FileNode extends FileSystemNode {
  readonly isFile: true
  readonly isDirectory: false
}

export interface FileSystemProvider extends LangiumFileSystemProvider {
  /**
   * Scans the project files for the given URI.
   * @returns The list of file system entries that are contained within the specified directory.
   */
  scanProjectFiles(folderUri: URI): Promise<FileNode[]>

  /**
   * Loads the project config from the given file.
   * @returns The project config.
   * @throws Error if the file does not exist or is not a valid project config.
   */
  loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig>

  /**
   * Reads the directory and returns LikeC4 files.
   *
   * @param options.recursive If true, recursively reads the directory,
   * @param options.maxDepth Maximum depth to traverse when recursive is true (default: Infinity)
   */
  readDirectory(uri: URI, options?: { recursive?: boolean; maxDepth?: number }): Promise<FileNode[]>

  /**
   * Finds all files in the given directory, matching the given filter.
   */
  scanDirectory(
    directory: URI,
    filter: (filepath: string, isDirectory: boolean) => boolean,
  ): Promise<FileNode[]>

  /**
   * Writes the content to the file system.
   * Used by manual layouts.
   */
  writeFile(uri: URI, content: string): Promise<void>

  /**
   * Deletes the file from the file system.
   * Used by manual layouts.
   * @return true if the file was deleted, false if the file did not exist.
   */
  deleteFile(uri: URI): Promise<boolean>
}

export interface FileSystemModuleContext extends FileSystemWatcherModuleContext {
  fileSystemProvider: (services: LikeC4SharedServices) => FileSystemProvider
}

export interface FileSystemWatcherModuleContext {
  fileSystemWatcher: (services: LikeC4SharedServices) => FileSystemWatcher
}

export interface FileSystemWatcher extends AsyncDisposable {
  /**
   * Watches a folder for changes and triggers a reload of the documents and projects.
   */
  watch(folder: string): void
}

export interface LikeC4ManualLayoutsModuleContext {
  manualLayouts: (services: LikeC4SharedServices) => LikeC4ManualLayouts
}

/**
 * What a file referenced by `descriptionFile` resolved to.
 */
export type DescriptionFileContent =
  | { readonly content: string }
  | { readonly error: string }

export interface LikeC4DescriptionFiles extends Disposable {
  /**
   * Reads the files referenced by `descriptionFile` in the given documents, so the synchronous
   * model parser can resolve them. Called on the `Parsed` document phase, before the parser runs.
   */
  read(docs: LangiumDocument[]): Promise<void>

  /**
   * Resolves and reads a single file, and remembers the result for the parser.
   */
  readFile(doc: LangiumDocument, path: string): Promise<DescriptionFileContent>

  /**
   * The file referenced by `path` from the document at `docUri`, resolved against that document.
   * `undefined` when the document does not reference it (or it has not been read yet).
   */
  get(docUri: URI, path: string): DescriptionFileContent | undefined

  /**
   * Whether `uri` is a file referenced by some document, and so worth watching.
   */
  isReferenced(uri: URI): boolean

  /**
   * Re-reads a referenced file after it changed on disk, and notifies the listeners so the model
   * that used it is rebuilt.
   */
  handleFileSystemUpdate(
    event: { update: URI; delete?: never } | { delete: URI; update?: never },
  ): Promise<void>

  /**
   * Registers a listener called when a referenced file changed.
   */
  onDescriptionFileUpdate(listener: DescriptionFileUpdateListener): Disposable

  clearCaches(): void
}

export type DescriptionFileUpdateEvent = {
  readonly uri: URI
  readonly projectId: ProjectId
}

export type DescriptionFileUpdateListener = (event: DescriptionFileUpdateEvent) => void

export type ManualLayoutsSnapshot = {
  hash: string
  views: Record<ViewId, LayoutedView>
}

export type ManualLayoutUpdateEvent =
  | {
    updated: URI
    projectId: ProjectId
    viewId: ViewId
  }
  | {
    removed: URI
    projectId: ProjectId
    /**
     * Missing if triggered by FS event (file was deleted)
     */
    viewId?: ViewId
  }
export type ManualLayoutUpdateListener = (event: ManualLayoutUpdateEvent) => void

export interface LikeC4ManualLayouts extends Disposable {
  /**
   * Reads a single layouted view from the file system by its URI.
   * Used by the language server to get the current layout state.
   */
  readSnapshot(uri: URI): Promise<LayoutedView | null>
  read(project: Project): Promise<ManualLayoutsSnapshot | null>
  write(project: Project, layouted: LayoutedView): Promise<Location>
  remove(project: Project, view: ViewId): Promise<Location | null>
  clearCaches(): void
  /**
   * Registers a listener for manual layout updates.
   * The listener will be called when a manual layout is created, updated, or deleted.
   */
  onManualLayoutUpdate(listener: ManualLayoutUpdateListener): Disposable

  /**
   * Handles file system updates for manual layouts.
   * Used by the file system watcher to notify the manual layouts module of changes.
   * @param event The file system event
   */
  handleFileSystemUpdate(event: { update: URI; delete?: never } | { delete: URI; update?: never }): Promise<void>
}

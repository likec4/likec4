import type { LikeC4ProjectConfig } from '@likec4/config'
import type { LayoutedView, ProjectId, ViewId } from '@likec4/core/types'
import type {
  AsyncDisposable,
  Disposable,
  FileSystemNode,
  FileSystemProvider as LangiumFileSystemProvider,
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
   * Reads the directory information for the given URI.
   * @param options.recursive If true, recursively reads the directory,
   * @param options.maxDepth Maximum depth to traverse when recursive is true (default: Infinity)
   */
  readDirectory(uri: URI, options?: { recursive?: boolean; maxDepth?: number }): Promise<FileNode[]>

  /**
   * Finds all files in the given directory, matching the given filter.
   */
  scanDirectory(directory: URI, filter: (filepath: string) => boolean): Promise<FileNode[]>

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
  fileSystemProvider: () => FileSystemProvider
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

export interface LikeC4ManualLayouts {
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

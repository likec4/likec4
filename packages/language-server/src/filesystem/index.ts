import type { LikeC4ProjectConfig } from '@likec4/config'
import type {
  FileSystemNode,
  FileSystemProvider as LangiumFileSystemProvider,
  LangiumSharedCoreServices,
} from 'langium'
import { URI } from 'vscode-uri'
import { type FileSystemWatcherModuleContext, NoFileSystemWatcher } from './FileSystemWatcher'
import type { LikeC4ManualLayouts, LikeC4ManualLayoutsModuleContext } from './LikeC4ManualLayouts'

export type { LikeC4ManualLayouts, LikeC4ManualLayoutsModuleContext }

export type { FileSystemWatcher } from './FileSystemWatcher'

export interface FileNode extends FileSystemNode {
  readonly isFile: true
  readonly isDirectory: false
}

export interface FileSystemProvider extends LangiumFileSystemProvider {
  /**
   * Scans the project files for the given URI.
   * @returns The list of file system entries that are contained within the specified directory.
   */
  scanProjectFiles(folderUri: URI): Promise<FileSystemNode[]>

  /**
   * Loads the project config from the given file.
   * @returns The project config.
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
  fileSystemProvider: (services: LangiumSharedCoreServices) => FileSystemProvider
}

export class NoopFileSystemProvider implements FileSystemProvider {
  scanProjectFiles(): Promise<FileSystemNode[]> {
    return Promise.resolve([])
  }
  scanDirectory(): Promise<FileNode[]> {
    return Promise.resolve([])
  }

  readFile(): Promise<string> {
    throw new Error('No file system is available.')
  }

  readDirectory(): Promise<FileNode[]> {
    return Promise.resolve([])
  }

  loadProjectConfig(): Promise<LikeC4ProjectConfig> {
    throw new Error('No file system is available.')
  }

  writeFile(): Promise<void> {
    throw new Error('No file system is available.')
  }

  deleteFile(): Promise<boolean> {
    throw new Error('No file system is available.')
  }
}

export const NoFileSystem: FileSystemModuleContext = {
  fileSystemProvider: () => new NoopFileSystemProvider(),
  ...NoFileSystemWatcher,
}
export { NoFileSystemWatcher }

export const NoLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext = {
  manualLayouts: (): LikeC4ManualLayouts => {
    return {
      read: () => Promise.resolve(null),
      write: () =>
        Promise.reject(
          new Error('NoopLikeC4ManualLayouts: write operation is not supported'),
        ),
      remove: () => Promise.resolve(null),
      clearCaches: () => {},
    }
  },
}

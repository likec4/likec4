import { type LikeC4ProjectConfig, isLikeC4Config, loadConfig } from '@likec4/config/node'
import { fdir } from 'fdir'
import { type FileSystemNode, URI } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { LikeC4LanguageMetaData } from '../generated/module'
import { Content, isLikeC4Builtin } from '../likec4lib'
import { logError } from '../logger'
import { chokidarFileSystemWatcher } from './ChokidarWatcher'
import { noopFileSystemWatcher } from './FileSystemWatcher'
import type { FileSystemModuleContext, FileSystemProvider } from './index'

export const LikeC4FileSystem = (
  ehableWatcher = true,
): FileSystemModuleContext => ({
  fileSystemProvider: () => new SymLinkTraversingFileSystemProvider(),
  ...ehableWatcher ? chokidarFileSystemWatcher : noopFileSystemWatcher,
})

export const isLikeC4File = (path: string) => LikeC4LanguageMetaData.fileExtensions.some((ext) => path.endsWith(ext))

export const isAnyLikeC4File = (path: string) => isLikeC4File(path) || isLikeC4Config(path)

/**
 * A file system provider that follows symbolic links.
 * @see https://github.com/likec4/likec4/pull/1213
 */
class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider implements FileSystemProvider {
  override async readFile(uri: URI): Promise<string> {
    if (isLikeC4Builtin(uri)) {
      return Promise.resolve(Content)
    }
    return await super.readFile(uri)
  }

  override async readDirectory(folderPath: URI): Promise<FileSystemNode[]> {
    const entries = [] as FileSystemNode[]
    try {
      const crawled = await new fdir()
        .withSymlinks({ resolvePaths: false })
        .withFullPaths()
        .filter(isLikeC4File)
        .crawl(folderPath.fsPath)
        .withPromise()
      for (const path of crawled) {
        entries.push({
          isFile: true,
          isDirectory: false,
          uri: URI.file(path),
        })
      }
    } catch (error) {
      logError(error)
    }
    return entries
  }

  async scanProjectFiles(folderUri: URI): Promise<FileSystemNode[]> {
    const entries = [] as FileSystemNode[]
    try {
      const crawled = await new fdir()
        .withSymlinks({ resolvePaths: false })
        .withFullPaths()
        .filter(isLikeC4Config)
        .crawl(folderUri.fsPath)
        .withPromise()
      for (const path of crawled) {
        entries.push({
          isFile: true,
          isDirectory: false,
          uri: URI.file(path),
        })
      }
    } catch (error) {
      logError(error)
    }
    return entries
  }

  async loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig> {
    return await loadConfig(filepath)
  }
}

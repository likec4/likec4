import { type LikeC4ProjectConfig, isLikeC4Config, loadConfig } from '@likec4/config/node'
import { fdir } from 'fdir'
import { type FileSystemNode, URI } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { mkdirSync } from 'node:fs'
import { stat, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { LikeC4LanguageMetaData } from '../generated/module'
import { Content, isLikeC4Builtin } from '../likec4lib'
import { logger as rootLogger } from '../logger'
import { chokidarFileSystemWatcher } from './ChokidarWatcher'
import { noopFileSystemWatcher } from './FileSystemWatcher'
import type { FileSystemModuleContext, FileSystemProvider } from './index'

const logger = rootLogger.getChild('filesystem')

export const LikeC4FileSystem = (
  ehableWatcher = true,
): FileSystemModuleContext => ({
  fileSystemProvider: () => new SymLinkTraversingFileSystemProvider(),
  ...ehableWatcher ? chokidarFileSystemWatcher : noopFileSystemWatcher,
})

export const isLikeC4File = (path: string) => LikeC4LanguageMetaData.fileExtensions.some((ext) => path.endsWith(ext))

/**
 * A file system provider that follows symbolic links.
 * @see https://github.com/likec4/likec4/pull/1213
 */
class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider implements FileSystemProvider {
  override async readFile(uri: URI): Promise<string> {
    if (isLikeC4Builtin(uri)) {
      return Promise.resolve(Content)
    }
    try {
      return await super.readFile(uri)
    } catch (error) {
      logger.warn(`Failed to read file ${uri.fsPath}`, { error })
      return ''
    }
  }

  override async readDirectory(
    folderPath: URI,
    opts?: { recursive?: boolean },
  ): Promise<FileSystemNode[]> {
    const recursive = opts?.recursive ?? true
    const entries = [] as FileSystemNode[]
    try {
      let crawler = new fdir()
        .withSymlinks({ resolvePaths: false })
        .withFullPaths()
        .filter(isLikeC4File)

      if (!recursive) {
        crawler = crawler.withMaxDepth(1)
      }

      const crawled = await crawler
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
      logger.warn(`Failed to read directory ${folderPath.fsPath}`, { error })
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
      logger.warn(`Failed to scan project files ${folderUri.fsPath}`, { error })
    }
    return entries
  }

  async scanDirectory(directory: URI, filter: (filepath: string) => boolean): Promise<FileSystemNode[]> {
    const entries = [] as FileSystemNode[]
    try {
      const crawled = await new fdir()
        .withSymlinks({ resolvePaths: false })
        .withFullPaths()
        .filter(filter)
        .crawl(directory.fsPath)
        .withPromise()
      for (const path of crawled) {
        entries.push({
          isFile: true,
          isDirectory: false,
          uri: URI.file(path),
        })
      }
    } catch (error) {
      logger.warn(`Failed to scan directory ${directory.fsPath}`, { error })
    }
    return entries
  }

  async loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig> {
    return await loadConfig(filepath)
  }

  async writeFile(uri: URI, content: string): Promise<void> {
    const dir = dirname(uri.fsPath)
    const exists = await stat(dir).catch(() => null)
    if (exists?.isFile()) {
      throw new Error(`Cannot create directory ${dir} because a file with the same name exists.`)
    }
    if (!exists) {
      logger.debug('creating directory {path}', { path: dir })
      // Create the directory synchronously on purpose
      // to prevent watchers from picking up the change too early
      mkdirSync(dir, { recursive: true })
    }
    logger.debug('writing file {path}', { path: uri.fsPath })
    return await writeFile(uri.fsPath, content, {
      encoding: 'utf-8',
    })
  }

  async deleteFile(uri: URI): Promise<boolean> {
    try {
      const path = uri.fsPath
      const exists = await stat(path)
      if (exists.isFile() || exists.isSymbolicLink()) {
        await unlink(path)
        logger.debug('deleted file {path}', { path })
        return true
      } else {
        logger.warn('deleteFile failed: {path} does not exist, or is not a file', { path })
      }
    } catch (error) {
      logger.warn(`Failed to delete file ${uri.fsPath}`, { error })
    }
    return false
  }
}

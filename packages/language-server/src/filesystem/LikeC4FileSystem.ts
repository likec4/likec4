import type { LikeC4ProjectConfig } from '@likec4/config'
import { isLikeC4Config, loadConfig } from '@likec4/config/node'
import { fdir } from 'fdir'
import { URI } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { mkdirSync, statSync } from 'node:fs'
import { unlink, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { Content, isLikeC4Builtin } from '../likec4lib'
import { logger as rootLogger } from '../logger'
import { WithChokidarWatcher } from './ChokidarWatcher'
import { NoFileSystemWatcher } from './noop'
import type { FileNode, FileSystemModuleContext, FileSystemProvider } from './types'
import { ensureOrder, excludeNodeModules, hasLikeC4Ext } from './utils'

const logger = rootLogger.getChild('filesystem')

function isLikeC4ConfigFile(path: string, isDirectory: boolean = false) {
  return !isDirectory && isLikeC4Config(basename(path))
}
function isLikeC4File(path: string, isDirectory: boolean = false): boolean {
  return !isDirectory && hasLikeC4Ext(basename(path))
}

export const WithFileSystem = (
  ehableWatcher = true,
): FileSystemModuleContext => ({
  fileSystemProvider: () => new SymLinkTraversingFileSystemProvider(),
  ...ehableWatcher ? WithChokidarWatcher : NoFileSystemWatcher,
})

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
    opts?: { recursive?: boolean; maxDepth?: number },
  ): Promise<FileNode[]> {
    const recursive = opts?.recursive ?? true
    const maxDepth = opts?.maxDepth ?? Infinity
    const entries = [] as FileNode[]

    try {
      let crawler = new fdir()
        .withSymlinks({ resolvePaths: false })
        .exclude(excludeNodeModules)
        .withFullPaths()
        .filter(isLikeC4File)

      if (!recursive) {
        crawler = crawler.withMaxDepth(1)
      } else if (maxDepth !== Infinity) {
        crawler = crawler.withMaxDepth(maxDepth)
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
    return entries.sort(ensureOrder)
  }

  async scanProjectFiles(folderUri: URI): Promise<FileNode[]> {
    return await this.scanDirectory(folderUri, isLikeC4ConfigFile)
  }

  async scanDirectory(
    directory: URI,
    filter: (filepath: string, isDirectory: boolean) => boolean,
  ): Promise<FileNode[]> {
    const entries = [] as FileNode[]
    try {
      const crawled = await new fdir()
        .withSymlinks({ resolvePaths: false })
        .exclude(excludeNodeModules)
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
      logger.warn(`Failed to scan directory {path}`, { path: directory.fsPath, error })
    }
    return entries
  }

  async loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig> {
    return await loadConfig(filepath)
  }

  async writeFile(uri: URI, content: string): Promise<void> {
    const dir = dirname(uri.fsPath)
    const exists = statSync(dir, { throwIfNoEntry: false })
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
      const exists = statSync(path, { throwIfNoEntry: false })
      if (exists?.isFile() || exists?.isSymbolicLink()) {
        await unlink(path)
        logger.debug('deleted file {path}', { path })
        return true
      } else {
        logger.warn('deleteFile failed: {path} does not exist, or is not a file', { path })
        return false
      }
    } catch (error) {
      logger.warn(`Failed to delete file ${uri.fsPath}`, { error })
    }
    return false
  }
}

import { type LikeC4ProjectConfig, isLikeC4Config, loadConfig } from '@likec4/config/node'
import { fdir } from 'fdir'
import { type FileSystemNode, URI } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
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
    try {
      return await super.readFile(uri)
    } catch (error) {
      logger.warn(`Failed to read file ${uri.fsPath}`, { error })
      return ''
    }
  }

  override async readDirectory(
    folderPath: URI,
    opts?: { onlyLikeC4Files?: boolean; recursive?: boolean },
  ): Promise<FileSystemNode[]> {
    const { onlyLikeC4Files, recursive } = {
      onlyLikeC4Files: true,
      recursive: true,
      ...opts,
    }
    const entries = [] as FileSystemNode[]
    try {
      let crawler = new fdir()
        .withSymlinks({ resolvePaths: false })
        .withFullPaths()

      if (onlyLikeC4Files) {
        crawler = crawler.filter(isLikeC4File)
      }

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

  async loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig> {
    return await loadConfig(filepath)
  }

  async writeFile(uri: URI, content: string): Promise<void> {
    logger.debug('writing file {path}', { path: uri.fsPath })
    const dir = dirname(uri.fsPath)
    if (!existsSync(dir)) {
      logger.debug('creating directory {path}', { path: dir })
      await mkdir(dir, { recursive: true })
    }
    return await writeFile(uri.fsPath, content, {
      encoding: 'utf-8',
      flush: true,
    })
  }
}

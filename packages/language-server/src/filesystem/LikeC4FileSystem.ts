import type { LikeC4ProjectConfig } from '@likec4/config'
import { isLikeC4Config, loadConfig } from '@likec4/config/node'
import { fdir } from 'fdir'
import { type FileSystemNode, URI } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { mkdirSync, statSync } from 'node:fs'
import { readFile as fsReadFile, unlink, writeFile as fsWriteFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { createStorage } from 'unstorage'
import fsLite from 'unstorage/drivers/fs-lite'
import { Content, isLikeC4Builtin } from '../likec4lib'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { compareByUri, compareByUriDeepFirst } from '../utils'
import type { UnstorageModuleContext } from '../workspace'
import { isDependencyUri } from '../workspace/dependency-uri'
import { WithChokidarWatcher } from './ChokidarWatcher'
import { NoFileSystemWatcher } from './noop'
import type { FileNode, FileSystemModuleContext, FileSystemProvider } from './types'
import { hasLikeC4Ext, isNodeModulesOrRepo } from './utils'

function isLikeC4ConfigFile(path: string, isDirectory: boolean = false) {
  return !isDirectory && isLikeC4Config(basename(path))
}
function isLikeC4File(path: string, isDirectory: boolean = false): boolean {
  return !isDirectory && hasLikeC4Ext(basename(path))
}

export const WithFileSystem = (
  enableWatcher = false,
): FileSystemModuleContext => ({
  fileSystemProvider: services => new SymLinkTraversingFileSystemProvider(services),
  ...(enableWatcher ? WithChokidarWatcher : NoFileSystemWatcher),
})

export const WithUnstorageCache = (cacheDir: string): UnstorageModuleContext => ({
  unstorage: () => {
    rootLogger.debug`unstorage at ${cacheDir}`
    return createStorage({
      driver: fsLite({
        base: cacheDir,
      }),
    })
  },
})
/**
 * A file system provider that follows symbolic links.
 * @see https://github.com/likec4/likec4/pull/1213
 */
class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider implements FileSystemProvider {
  #logger = rootLogger.getChild('filesystem')

  constructor(private services: LikeC4SharedServices) {
    super()
  }

  private isExcluded(path: string): boolean {
    // Read the current matcher lazily: editor exclusions are configured after
    // service construction and can change before a project reload.
    return this.services.workspace.ProjectsManager.isExcludedByWorkspace(URI.file(path))
  }

  private excludeDirectory = (name: string, path: string): boolean => {
    return isNodeModulesOrRepo(name) || this.isExcluded(path)
  }

  /**
   * Text of a document of an external project (`likec4-dep` scheme), from memory
   */
  private readDependency(uri: URI): string | undefined {
    if (!isDependencyUri(uri)) {
      return undefined
    }
    return this.services.workspace.ExternalProjects.readFile(uri)
  }

  override async readFile(uri: URI): Promise<string> {
    if (isLikeC4Builtin(uri)) {
      return Promise.resolve(Content)
    }
    if (isDependencyUri(uri)) {
      return this.readDependency(uri) ?? ''
    }
    try {
      // Read with own `node:fs` (not the one of langium), same as other file operations here
      return await fsReadFile(uri.fsPath, 'utf-8')
    } catch (error) {
      this.#logger.warn(`Failed to read file ${uri.fsPath}`, { error })
      return ''
    }
  }

  override readFileSync(uri: URI): string {
    if (isLikeC4Builtin(uri)) {
      return Content
    }
    if (isDependencyUri(uri)) {
      return this.readDependency(uri) ?? ''
    }
    return super.readFileSync(uri)
  }

  override exists(uri: URI): Promise<boolean> {
    if (isDependencyUri(uri)) {
      return Promise.resolve(this.readDependency(uri) !== undefined)
    }
    return super.exists(uri)
  }

  override existsSync(uri: URI): boolean {
    if (isDependencyUri(uri)) {
      return this.readDependency(uri) !== undefined
    }
    return super.existsSync(uri)
  }

  override async stat(uri: URI): Promise<FileSystemNode> {
    if (isDependencyUri(uri)) {
      return this.statSync(uri)
    }
    return await super.stat(uri)
  }

  override statSync(uri: URI): FileSystemNode {
    if (isDependencyUri(uri)) {
      if (this.readDependency(uri) === undefined) {
        throw new Error(`Document of external project not found: ${uri.toString()}`)
      }
      return { isFile: true, isDirectory: false, uri }
    }
    return super.statSync(uri)
  }

  override async readDirectory(
    folderPath: URI,
    opts?: { recursive?: boolean; maxDepth?: number },
  ): Promise<FileNode[]> {
    if (this.isExcluded(folderPath.fsPath)) {
      return []
    }
    const recursive = opts?.recursive ?? true
    const maxDepth = opts?.maxDepth ?? Infinity
    const entries = [] as FileNode[]

    try {
      let crawler = new fdir()
        .withSymlinks({ resolvePaths: false })
        .exclude(this.excludeDirectory)
        .withFullPaths()
        .filter(path => isLikeC4File(path) && !this.isExcluded(path))

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
      return entries.sort(compareByUri)
    } catch (error) {
      this.#logger.warn(`Failed to read directory ${folderPath.fsPath}`, { error })
      return []
    }
  }

  async scanProjectFiles(folderUri: URI): Promise<FileNode[]> {
    const files = await this.scanDirectory(folderUri, isLikeC4ConfigFile)
    if (files.length <= 1) {
      return files
    }
    return files.sort(compareByUriDeepFirst)
  }

  async scanDirectory(
    directory: URI,
    filter: (filepath: string, isDirectory: boolean) => boolean,
  ): Promise<FileNode[]> {
    if (this.isExcluded(directory.fsPath)) {
      return []
    }
    const entries = [] as FileNode[]
    try {
      const crawled = await new fdir()
        .withSymlinks({ resolvePaths: false })
        .exclude(this.excludeDirectory)
        .withFullPaths()
        .filter((path, isDirectory) => filter(path, isDirectory) && !this.isExcluded(path))
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
      this.#logger.warn(`Failed to scan directory {path}`, { path: directory.fsPath, error })
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
      this.#logger.debug('creating directory {path}', { path: dir })
      // Create the directory synchronously on purpose
      // to prevent watchers from picking up the change too early
      mkdirSync(dir, { recursive: true })
    }
    this.#logger.debug('writing file {path}', { path: uri.fsPath })
    return await fsWriteFile(uri.fsPath, content, {
      encoding: 'utf-8',
    })
  }

  async deleteFile(uri: URI): Promise<boolean> {
    try {
      const path = uri.fsPath
      const exists = statSync(path, { throwIfNoEntry: false })
      if (exists?.isFile() || exists?.isSymbolicLink()) {
        await unlink(path)
        this.#logger.debug('deleted file {path}', { path })
        return true
      } else {
        this.#logger.warn('deleteFile failed: {path} does not exist, or is not a file', { path })
        return false
      }
    } catch (error) {
      this.#logger.warn(`Failed to delete file ${uri.fsPath}`, { error })
    }
    return false
  }
}

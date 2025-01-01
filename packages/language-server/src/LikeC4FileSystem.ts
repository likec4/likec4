import { fdir } from 'fdir'
import { type FileSystemNode, URI } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { stat } from 'node:fs/promises'
import { logger } from './logger'

export const LikeC4FileSystem = {
  fileSystemProvider: () => new SymLinkTraversingFileSystemProvider(),
}

/**
 * A file system provider that follows symbolic links.
 * @see https://github.com/likec4/likec4/pull/1213
 */
class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider {
  override async readDirectory(folderPath: URI): Promise<FileSystemNode[]> {
    const crawled = await new fdir()
      .withSymlinks()
      .withFullPaths()
      .crawl(folderPath.fsPath)
      .withPromise()
    const entries = [] as FileSystemNode[]
    for (const path of crawled) {
      try {
        const stats = await stat(path)
        entries.push({
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          uri: URI.file(path),
        })
      } catch (error) {
        logger.error(error)
      }
    }
    return entries
  }
}

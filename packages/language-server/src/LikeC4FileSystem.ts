import { type FileSystemNode, URI, UriUtils } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { lstatSync, readlinkSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export const LikeC4FileSystem = {
  fileSystemProvider: () => new SymLinkTraversingFileSystemProvider()
}

/**
 * A file system provider that follows symbolic links.
 * @see https://github.com/likec4/likec4/pull/1213
 */
class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider {
  override async readDirectory(folderPath: URI): Promise<FileSystemNode[]> {
    const dirents = await readdir(folderPath.fsPath, { withFileTypes: true })
    return dirents.map(dirent => (this.followUri(UriUtils.joinPath(folderPath, dirent.name))))
  }

  followUri(uri: URI): FileSystemNode {
    const directoryPath = dirname(uri.fsPath)
    const stat = lstatSync(uri.fsPath)
    if (stat.isSymbolicLink()) {
      const resolved_link = readlinkSync(uri.fsPath)
      const linked_path = resolve(directoryPath, resolved_link)
      return this.followUri(URI.file(linked_path))
    } else {
      return {
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        uri
      }
    }
  }
}

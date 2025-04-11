import { fdir } from 'fdir'
import { type FileSystemNode, URI } from 'langium'
import { NodeFileSystemProvider } from 'langium/node'
import { LikeC4LanguageMetaData } from './generated/module'
import { Content, isLikeC4Builtin } from './likec4lib'
import { logError } from './logger'
import { ProjectsManager } from './workspace/ProjectsManager'

export const LikeC4FileSystem = {
  fileSystemProvider: () => new SymLinkTraversingFileSystemProvider(),
}

const SearchExtension = [
  ...LikeC4LanguageMetaData.fileExtensions,
  ...ProjectsManager.ConfigFileNames,
]

const hasExtension = (path: string) => SearchExtension.some((ext) => path.endsWith(ext))
/**
 * A file system provider that follows symbolic links.
 * @see https://github.com/likec4/likec4/pull/1213
 */
class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider {
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
        .filter(hasExtension)
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
}

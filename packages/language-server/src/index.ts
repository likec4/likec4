import { URI, UriUtils } from 'langium'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { NodeFileSystemProvider } from 'langium/node'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { createLanguageServices } from './module'

export { logger as lspLogger, setLogLevel } from './logger'
export type * from './model'
export type * from './module'
export { createCustomLanguageServices, createLanguageServices, LikeC4Module } from './module'

import type { FileSystemNode } from 'langium'
import * as fs from 'node:fs'
import * as path from 'node:path'

export function startLanguageServer() {
  /* browser specific setup code */
  const connection = createConnection(ProposedFeatures.all)

  // Inject the shared services and language-specific services
  const services = createLanguageServices({ connection, ...LikeC4FileSystem })

  // Start the language server with the shared services
  startLanguim(services.shared)

  return {
    ...services,
    connection
  }
}

export const LikeC4FileSystem = {
  fileSystemProvider: () => new SymLinkTraversingFileSystemProvider()
}

class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider {
  override async readDirectory(folderPath: URI): Promise<FileSystemNode[]> {
    const dirents = await fs.promises.readdir(folderPath.fsPath, { withFileTypes: true })
    return dirents.map(dirent => (this.followUri(UriUtils.joinPath(folderPath, dirent.name))))
  }

  followUri(uri: URI): FileSystemNode {
    const directoryPath = path.dirname(uri.fsPath)
    const stat = fs.lstatSync(uri.fsPath)
    if (stat.isSymbolicLink()) {
      const resolved_link = fs.readlinkSync(uri.fsPath)
      const linked_path = path.resolve(directoryPath, resolved_link)
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

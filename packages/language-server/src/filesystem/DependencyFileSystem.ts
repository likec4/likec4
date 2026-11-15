import type { FileSystemNode, URI } from 'langium'
import type { LikeC4SharedServices } from '../module'
import { isDependencyUri } from '../workspace/dependency-uri'

/**
 * Read-only file system of documents of external projects (`likec4-dep` scheme).
 *
 * `FileSystemProvider` of Langium requires synchronous methods, while dependencies are loaded asynchronously
 * (file system, dependency storage): instances are loaded into memory entirely on registration
 * (see `ExternalProjects`), and their documents are served from memory here.
 *
 * Browser-safe (no `node:*` imports): used by the Node file system provider and by the provider without file system.
 */
export class DependencyFileSystem {
  constructor(protected services?: LikeC4SharedServices) {}

  /**
   * Whether the URI is a URI of a document of an external project (served by this file system only)
   */
  handles(uri: URI): boolean {
    return isDependencyUri(uri)
  }

  /**
   * Text of the document from memory, undefined if no registered instance has it
   */
  readFile(uri: URI): string | undefined {
    if (!isDependencyUri(uri)) {
      return undefined
    }
    return this.services?.workspace.ExternalProjects.readFile(uri)
  }

  exists(uri: URI): boolean {
    return this.readFile(uri) !== undefined
  }

  /**
   * @throws if no registered instance has the document
   */
  stat(uri: URI): FileSystemNode {
    if (!this.exists(uri)) {
      throw new Error(`Document of external project not found: ${uri.toString()}`)
    }
    return { isFile: true, isDirectory: false, uri }
  }
}

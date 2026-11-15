import { type Cancellation, URI } from 'langium'
import { DefaultTextDocumentContentProvider } from 'langium/lsp'
import type { TextDocumentContentParams, TextDocumentContentResult } from 'vscode-languageserver-protocol'
import type { LikeC4SharedServices } from '../module'
import { DEPENDENCY_URI_SCHEME } from '../workspace/dependency-uri'

/**
 * Serves documents of external projects (`likec4-dep` scheme) to the client (`workspace/textDocumentContent`),
 * so "Go to definition" opens a read-only copy of a dependency document.
 *
 * Differs from {@link DefaultTextDocumentContentProvider} in two ways:
 * - waits for the startup and the pending syncs of external projects (reload, install),
 *   so an editor showing a dependency document gets the content of the registered instance;
 * - falls back to the registered instances (memory of `ExternalProjects`) if there is no Langium document.
 *
 * Not called under the workspace lock (Langium does not take it for this request).
 */
export class LikeC4TextDocumentContentProvider extends DefaultTextDocumentContentProvider {
  /**
   * URIs the client asked content for (with or without result): when such a document is registered later
   * (install, switch back to a SHA), the client is asked to refresh it
   */
  #requested = new Set<string>()

  constructor(protected services: LikeC4SharedServices) {
    super(services, DEPENDENCY_URI_SCHEME)
  }

  /**
   * Whether the client asked for the content of the document before
   */
  wasRequested(uri: URI | string): boolean {
    return this.#requested.has(typeof uri === 'string' ? URI.parse(uri).toString() : uri.toString())
  }

  override async provideTextDocumentContent(
    params: TextDocumentContentParams,
    cancellationToken: Cancellation.CancellationToken,
  ): Promise<TextDocumentContentResult | undefined> {
    const uri = URI.parse(params.uri)
    if (!this.schemes.includes(uri.scheme)) {
      return undefined
    }
    this.#requested.add(uri.toString())
    const workspaceManager = this.services.workspace.WorkspaceManager
    await workspaceManager.ready
    await workspaceManager.whenExternalProjectsSynced()
    const result = await super.provideTextDocumentContent(params, cancellationToken)
    if (result) {
      return result
    }
    const text = this.services.workspace.ExternalProjects.readFile(uri)
    return text !== undefined ? { text } : undefined
  }
}

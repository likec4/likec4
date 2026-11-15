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
  constructor(protected services: LikeC4SharedServices) {
    super(services, DEPENDENCY_URI_SCHEME)
  }

  override async provideTextDocumentContent(
    params: TextDocumentContentParams,
    cancellationToken: Cancellation.CancellationToken,
  ): Promise<TextDocumentContentResult | undefined> {
    const uri = URI.parse(params.uri)
    if (!this.schemes.includes(uri.scheme)) {
      return undefined
    }
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

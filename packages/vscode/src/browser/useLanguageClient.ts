import useDocumentSelector from '#useDocumentSelector'
import {
  createSingletonComposable,
  extensionContext,
  toValue,
  tryOnScopeDispose,
  useDisposable,
} from 'reactive-vscode'
import vscode from 'vscode'
import type { LanguageClientOptions } from 'vscode-languageclient/browser'
import { LanguageClient as BrowserLanguageClient } from 'vscode-languageclient/browser'
import { useExtensionLogger } from '../useExtensionLogger'
import { isLikeC4Source } from '../utils'

const useLanguageClient = createSingletonComposable(() => {
  const { output } = useExtensionLogger()
  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(
    extensionContext.value!.extensionUri,
    'dist',
    'browser',
    'language-server-worker.iife.js',
  ).toString(true)

  output.info(`worker: ${serverMain}`)

  const worker = new Worker(serverMain, {
    name: 'LikeC4 Language Server',
  })

  tryOnScopeDispose(() => {
    worker.terminate()
  })

  const documentSelector = useDocumentSelector()

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: 'likec4',
    markdown: {
      isTrusted: true,
      supportHtml: true,
    },
    ...(workspaceFolder ? { workspaceFolder } : {}),
    diagnosticPullOptions: {
      onTabs: true,
      match(_, resource) {
        return isLikeC4Source(resource.path)
      },
    },
    documentSelector: toValue(documentSelector),
  }

  // Create and start the language client.
  const client = new BrowserLanguageClient('likec4', 'LikeC4 Language Server', clientOptions, worker)
  return useDisposable(client)
})

export default useLanguageClient

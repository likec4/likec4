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
import { isLikeC4Source } from '../common/initWorkspace'
import { extensionLogger, logger } from '../logger'

const useLanguageClient = createSingletonComposable(() => {
  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(
    extensionContext.value!.extensionUri,
    'dist',
    'browser',
    'language-server-worker.js',
  ).toString(true)

  logger.info(`worker: ${serverMain}`)

  const worker = new Worker(serverMain, {
    name: 'LikeC4 Language Server',
  })

  tryOnScopeDispose(() => {
    worker.terminate()
  })

  const documentSelector = useDocumentSelector()

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    outputChannel: extensionLogger.outputChannel.value!,
    diagnosticCollectionName: 'likec4',
    markdown: {
      isTrusted: true,
      supportHtml: true,
    },
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

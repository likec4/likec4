import useDocumentSelector from '#useDocumentSelector'
import {
  defineService,
  extensionContext,
  onDeactivate,
  toValue,
  useDisposable,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import type { LanguageClientOptions } from 'vscode-languageclient/browser'
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  LanguageClient as BrowserLanguageClient,
} from 'vscode-languageclient/browser'
import { useExtensionLogger } from '../useExtensionLogger'
import { isLikeC4Source } from '../utils'

const useLanguageClient = defineService(() => {
  const { output } = useExtensionLogger()
  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(
    extensionContext.value!.extensionUri,
    'dist',
    'browser',
    'language-server-worker.iife.js',
  ).toString(true)

  output.info(`worker: ${serverMain}`)

  let worker: Worker | null = null

  onDeactivate(() => {
    worker?.terminate()
    worker = null
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

  // Create the language client lazily; the Web Worker is spawned only when client.start() runs.
  const client = new BrowserLanguageClient(
    'likec4',
    'LikeC4 Language Server',
    async () => {
      worker ??= new Worker(serverMain, {
        name: 'LikeC4 Language Server',
      })
      return {
        reader: new BrowserMessageReader(worker),
        writer: new BrowserMessageWriter(worker),
      }
    },
    clientOptions,
  )
  return useDisposable(client)
})

export default useLanguageClient

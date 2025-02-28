import {
  defineExtension,
  extensionContext,
} from 'reactive-vscode'
import vscode from 'vscode'
import {
  type LanguageClientOptions,
  LanguageClient as BrowserLanguageClient,
} from 'vscode-languageclient/browser'
import { activateLanguageClient } from '../activate'
import { initWorkspace } from '../common/initWorkspace'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { languageId } from '../const'

export const { activate, deactivate } = defineExtension(() => {
  const logger = useExtensionLogger()
  logger.whenReady.then(() => {
    activateLanguageClient(
      // Create a language client
      (id, name, props) => {
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

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
          ...props,
          documentSelector: [
            { language: languageId, scheme: 'file' },
            { language: languageId, scheme: 'vscode-vfs' },
            { language: languageId, scheme: 'vscode-test-web' },
            { language: languageId, scheme: 'vscode-remote' },
          ],
        }

        // Create and start the language client.
        const client = new BrowserLanguageClient(id, name, clientOptions, worker)
        client.start()

        return client
      },
      // On Activated
      ({ rpc }) => {
        initWorkspace(rpc)
      },
    )
  })
})

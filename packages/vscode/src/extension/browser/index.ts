import type { ExtensionContext } from '$/di'
import { activateExtension } from '$/extension/activate'
import * as vscode from 'vscode'
import { fileExtensions, languageId } from '$/meta'
import { LanguageClient as BrowserLanguageClient, type LanguageClientOptions } from 'vscode-languageclient/browser'

let client: BrowserLanguageClient | undefined

// this method is called when vs code is activated
export function activate(context: ExtensionContext) {

  client = createLanguageClient(context)

  void activateExtension({ client, context })
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
  return client?.stop()
}

function createLanguageClient(context: ExtensionContext) {

  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist', 'browser', 'server.js').toString(true)
  const worker = new Worker(serverMain, {
    name: 'LikeC4 LanguageServer Worker',
  })

  const extensions = fileExtensions.map(s => s.substring(1)).join(',')
  const globPattern = `**/*.{${extensions}}`
  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
  context.subscriptions.push(fileSystemWatcher)


  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      ...fileExtensions.map(ext => ({
        pattern: `**/*${ext}`
      })),
      { language: languageId },
    ],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher
    }
  }

  // Create the language client and start the client.
  return new BrowserLanguageClient(
    languageId,
    'LikeC4',
    clientOptions,
    worker
  )
}

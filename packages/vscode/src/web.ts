import type { ExtensionContext } from 'src/di'
import { activateExtension } from 'src/extension/activate'
import { fileExtensions, languageId } from 'src/meta'
import * as vscode from 'vscode'
import {
  LanguageClient as BrowserLanguageClient,
  type LanguageClientOptions
} from 'vscode-languageclient/browser'

let worker: Worker | undefined
let client: BrowserLanguageClient | undefined

// this method is called when vs code is activated
export function activate(context: ExtensionContext) {
  client = createLanguageClient(context)

  void activateExtension({ client, context }, true)
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
  return client?.dispose().then(() => worker?.terminate())
}

function createLanguageClient(context: ExtensionContext) {
  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'lsp',
    'web-worker.js'
  ).toString(true)
  worker = new Worker(serverMain, {
    name: 'LikeC4 LSP Worker'
  })

  const extensions = fileExtensions.map(s => s.substring(1)).join(',')
  const globPattern = `**/*.{${extensions}}`
  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
  context.subscriptions.push(fileSystemWatcher)

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { pattern: globPattern, scheme: 'file' },
      { pattern: globPattern, scheme: 'vscode-vfs' },
      { language: languageId, scheme: 'file' },
      { language: languageId, scheme: 'vscode-vfs' },
    ],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher
    }
  }

  // Create the language client and start the client.
  return new BrowserLanguageClient(languageId, 'LikeC4 Extension', clientOptions, worker)
}

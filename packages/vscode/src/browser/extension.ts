import { hasAtLeast } from '@likec4/core'
import * as vscode from 'vscode'
import {
  LanguageClient as BrowserLanguageClient,
  type LanguageClientOptions
} from 'vscode-languageclient/browser'
import ExtensionController from '../common/ExtensionController'
import { extensionName, extensionTitle, languageId } from '../const'

let controller: ExtensionController | undefined

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  const ctrl = (controller = new ExtensionController(context, createLanguageClient(context)))
  void ctrl.activate()
}

// This function is called when the extension is deactivated.
export function deactivate() {
  return controller?.deactivate()
}

function createLanguageClient(context: vscode.ExtensionContext) {
  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'browser',
    'language-server-worker.js'
  ).toString(true)
  const worker = new Worker(serverMain, {
    name: 'LikeC4 Language Server'
  })

  const workspaceFolders = vscode.workspace.workspaceFolders ?? []

  const outputChannel = vscode.window.createOutputChannel(extensionTitle, {
    log: true
  })
  context.subscriptions.push(outputChannel)

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: extensionName,
    outputChannel,
    traceOutputChannel: outputChannel,
    documentSelector: [
      { language: languageId, scheme: 'file' },
      { language: languageId, scheme: 'vscode-vfs' },
      { language: languageId, scheme: 'vscode-test-web' }
    ],
    synchronize: {},
    initializationOptions: {}
  }

  if (hasAtLeast(workspaceFolders, 1)) {
    const workspace = workspaceFolders[0]
    outputChannel.info(`Workspace: ${workspace.uri}`)
  } else {
    outputChannel.info(`No workspace`)
  }

  // Create the language client and start the client.
  return new BrowserLanguageClient(languageId, extensionTitle, clientOptions, worker)
}

import * as vscode from 'vscode'
import {
  LanguageClient as BrowserLanguageClient,
  type LanguageClientOptions
} from 'vscode-languageclient/browser'
import ExtensionController from '../common/ExtensionController'
import { extensionName, extensionTitle, globPattern, languageId } from '../const'
import { disposable } from '../util'
import { hasAtLeast } from '@likec4/core'

let controller: ExtensionController | undefined

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  const ctrl = (controller = new ExtensionController(context, createLanguageClient(context)))
  void ctrl.activate()
}

// This function is called when the extension is deactivated.
export function deactivate() {
  controller?.deactivate()
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

  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
  context.subscriptions.push(fileSystemWatcher)
  context.subscriptions.push(disposable(() => worker.terminate()))

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
      { pattern: globPattern, scheme: 'file' },
      { pattern: globPattern, scheme: 'vscode-vfs' },
      { pattern: globPattern, scheme: 'vscode-test-web' },
      { language: languageId, scheme: 'file' },
      { language: languageId, scheme: 'vscode-vfs' },
      { language: languageId, scheme: 'vscode-test-web' }
    ],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher
    },
    progressOnInitialization: true
  }

  if (hasAtLeast(workspaceFolders, 1)) {
    const workspace = workspaceFolders[0]
    outputChannel.info(`Workspace: ${workspace.uri}`)
    clientOptions.workspaceFolder = workspace
  } else {
    outputChannel.info(`No workspace`)
  }

  // Create the language client and start the client.
  return new BrowserLanguageClient(languageId, extensionTitle, clientOptions, worker)
}

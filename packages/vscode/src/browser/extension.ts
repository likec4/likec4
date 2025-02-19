import { hasAtLeast } from '@likec4/core'
import type { Scheme as LibScheme } from '@likec4/language-server/likec4lib'
import * as vscode from 'vscode'
import { type LanguageClientOptions, LanguageClient as BrowserLanguageClient } from 'vscode-languageclient/browser'
import { extensionName, extensionTitle, isDev, languageId } from '../const'
import { ExtensionController } from '../ExtensionController'
import { configureLogger, logger } from '../logger'

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  const client = createLanguageClient(context)
  ExtensionController.activate(context, client)
}

// This function is called when the extension is deactivated.
export function deactivate() {
  ExtensionController.deactivate()
}

function createLanguageClient(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(extensionTitle, {
    log: true,
  })
  context.subscriptions.push(
    outputChannel,
  )
  configureLogger(outputChannel)
  logger.info('active browser extension')

  if (isDev) {
    logger.warn('!!! Running in development mode !!!')
  }

  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'browser',
    'language-server-worker.js',
  ).toString(true)

  logger.debug(`worker: ${serverMain}`)

  const worker = new Worker(serverMain, {
    name: 'LikeC4 Language Server',
  })

  const workspaceFolders = vscode.workspace.workspaceFolders ?? []

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: extensionName,
    outputChannel,
    traceOutputChannel: outputChannel,
    documentSelector: [
      { language: languageId, scheme: 'file' },
      { language: languageId, scheme: 'vscode-vfs' },
      { language: languageId, scheme: 'vscode-test-web' },
      { language: languageId, scheme: 'vscode-remote' },
      { language: languageId, scheme: 'likec4builtin' satisfies typeof LibScheme },
    ],
  }

  if (hasAtLeast(workspaceFolders, 1)) {
    workspaceFolders.forEach(workspace => {
      outputChannel.info(`Workspace: ${workspace.uri}`)
    })
  } else {
    outputChannel.info(`No workspace`)
  }

  // Create the language client and start the client.
  return new BrowserLanguageClient(languageId, extensionTitle, clientOptions, worker)
}

import { hasAtLeast } from '@likec4/core'
import { Scheme } from '@likec4/language-server/likec4lib'
import * as vscode from 'vscode'
import { LanguageClient as BrowserLanguageClient, type LanguageClientOptions } from 'vscode-languageclient/browser'
import { BuiltInFileSystemProvider } from '../common/BuiltInFileSystemProvider'
import { ExtensionController } from '../common/ExtensionController'
import { extensionName, extensionTitle, languageId } from '../const'
import { logger, logToChannel } from '../logger'

let controller: ExtensionController | undefined
let worker: Worker | undefined

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  BuiltInFileSystemProvider.register(context)
  const ctrl = (controller = new ExtensionController(context, createLanguageClient(context)))
  void ctrl.activate()
}

// This function is called when the extension is deactivated.
export function deactivate() {
  controller?.dispose()
  controller = undefined
}

function createLanguageClient(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(extensionTitle, {
    log: true
  })
  context.subscriptions.push(
    outputChannel,
    logToChannel(outputChannel)
  )
  logger.info('active browser extension')

  // @ts-ignore
  const isProduction = process.env.NODE_ENV === 'production'

  if (!isProduction) {
    logger.warn('!!! Running in development mode !!!')
  }

  // Create a worker. The worker main file implements the language server.
  const serverMain = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'browser',
    'language-server-worker.js'
  ).toString(true)

  logger.debug(`worker: ${serverMain}`)

  worker = new Worker(serverMain, {
    name: 'LikeC4 Language Server'
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
      { language: languageId, scheme: Scheme }
    ]
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

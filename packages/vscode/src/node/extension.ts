import { Scheme as LibScheme } from '@likec4/language-server/likec4lib'
import os from 'node:os'
import path from 'node:path'
import * as vscode from 'vscode'
import {
  LanguageClient as NodeLanguageClient,
  type LanguageClientOptions,
  RevealOutputChannelOn,
  type ServerOptions,
  type TextDocumentFilter,
  TransportKind
} from 'vscode-languageclient/node'
import { ExtensionController } from '../common/ExtensionController'
import { extensionTitle, globPattern, isVirtual, languageId } from '../const'
import { logger, logToChannel } from '../logger'
import { configureGraphviz } from './configure-graphviz'

function isWindows() {
  return os.platform() === 'win32'
}

let controller: ExtensionController | undefined

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  const client = createLanguageClient(context)
  const ctrl = (controller = new ExtensionController(context, client))
  ctrl.activate().catch(e => {
    logger.error(`Failed to activate: ${e}`)
  })
  configureGraphviz(ctrl)
}

// This function is called when the extension is deactivated.
export function deactivate() {
  controller?.dispose()
  controller = undefined
}

function createLanguageClient(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('LikeC4 - Extension', {
    log: true
  })
  context.subscriptions.push(
    outputChannel,
    logToChannel(outputChannel)
  )
  logger.info('active node extension')
  // Disposed explicitly by the controller
  // context.subscriptions.push(outputChannel)

  const serverModule = path.join(
    context.extensionPath,
    'dist',
    'node',
    'language-server.js'
  )

  // @ts-ignore
  const isProduction = process.env.NODE_ENV === 'production'

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverModule,
      runtime: 'node',
      transport: TransportKind.ipc,
      options: {
        detached: false,
        execArgv: [
          '--nolazy',
          `--inspect${process.env['DEBUG_BREAK'] ? '-brk' : ''}=${process.env['DEBUG_SOCKET'] || '9229'}`
        ]
      }
    }
  }

  if (!isProduction) {
    logger.warn('!!! Running in development mode !!!')
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  }

  const workspaceFolders = vscode.workspace.workspaceFolders ?? []

  if (workspaceFolders.length === 0) {
    logger.warn(`No workspace folder found`)
  }

  // The glob pattern used to find likec4 source files inside the workspace
  const scheme = isVirtual() ? 'vscode-vfs' : 'file'
  const documentSelector = (isWindows() || workspaceFolders.length === 0)
    ? [
      { language: languageId, scheme } // TODO: Can't figure out why
    ]
    : workspaceFolders.map((f): TextDocumentFilter => {
      const w = vscode.Uri.joinPath(f.uri, globPattern)
      return { language: languageId, scheme, pattern: w.scheme === 'file' ? w.fsPath : w.path }
    })

  // Add the scheme for the likec4libq
  documentSelector.push({ language: languageId, scheme: LibScheme })

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    revealOutputChannelOn: RevealOutputChannelOn.Warn,
    outputChannelName: extensionTitle,
    documentSelector,
    diagnosticCollectionName: 'likec4',
    progressOnInitialization: true
  }
  logger.info(`Document selector: ${JSON.stringify(clientOptions.documentSelector, null, 2)}`)

  // Create the language client and start the client.
  return new NodeLanguageClient(languageId, extensionTitle, serverOptions, clientOptions)
}

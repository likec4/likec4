import * as vscode from 'vscode'
import {
  LanguageClient as NodeLanguageClient,
  TransportKind,
  type LanguageClientOptions,
  type ServerOptions
} from 'vscode-languageclient/node'
import { extensionTitle, globPattern, languageId } from '../const'
import ExtensionController from '../common/ExtensionController'

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
  const serverModule = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'node',
    'language-server.js'
  ).fsPath
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: [
      '--nolazy',
      `--inspect${process.env['DEBUG_BREAK'] ? '-brk' : ''}=${
        process.env['DEBUG_SOCKET'] || '6009'
      }`
    ]
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  }

  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
  context.subscriptions.push(fileSystemWatcher)

  const outputChannel = vscode.window.createOutputChannel(extensionTitle, {
    log: true
  })
  context.subscriptions.push(outputChannel)

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    outputChannel,
    traceOutputChannel: outputChannel,
    documentSelector: [
      { pattern: globPattern, scheme: 'file' },
      { pattern: globPattern, scheme: 'vscode-vfs' },
      { language: languageId, scheme: 'file' },
      { language: languageId, scheme: 'vscode-vfs' }
    ],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher
    },
    progressOnInitialization: true
  }

  // Create the language client and start the client.
  return new NodeLanguageClient(languageId, extensionTitle, serverOptions, clientOptions)
}

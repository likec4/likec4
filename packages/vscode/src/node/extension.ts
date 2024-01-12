import os from 'node:os'
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
import { Logger } from '../logger'

function isWindows() {
  return os.platform() === 'win32'
}

let controller: ExtensionController | undefined

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  Logger.info('[Extension] active node extension')
  const client = createLanguageClient(context)
  const ctrl = (controller = new ExtensionController(context, client))
  void ctrl.activate()
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<unknown> {
  return Promise.resolve()
    .then(() => controller?.deactivate())
    .finally(() => {
      controller = undefined
    })
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
      `--inspect${process.env['DEBUG_BREAK'] ? '-brk' : ''}=${process.env['DEBUG_SOCKET'] || '6009'}`
    ]
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  }

  const outputChannel = vscode.window.createOutputChannel(extensionTitle, {
    log: true
  })
  // Disposed explicitly by the controller
  // context.subscriptions.push(outputChannel)

  const workspaceFolders = vscode.workspace.workspaceFolders ?? []

  if (workspaceFolders.length === 0) {
    outputChannel.warn(`No workspace folder found`)
  }

  const watcher = vscode.workspace.createFileSystemWatcher(globPattern)
  context.subscriptions.push(watcher)

  // The glob pattern used to find likec4 source files inside the workspace
  const scheme = isVirtual() ? 'vscode-vfs' : 'file'
  const documentSelector = isWindows()
    ? [
      { language: languageId, scheme } // TODO: Can't figure out why
    ]
    : workspaceFolders.map((f): TextDocumentFilter => {
      const w = vscode.Uri.joinPath(f.uri, globPattern)
      return { language: languageId, scheme, pattern: w.scheme === 'file' ? w.fsPath : w.path }
    })

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    revealOutputChannelOn: RevealOutputChannelOn.Warn,
    outputChannel,
    traceOutputChannel: outputChannel,
    documentSelector,
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: watcher
    }
  }
  outputChannel.info(`Document selector: ${JSON.stringify(clientOptions.documentSelector, null, 2)}`)

  // Create the language client and start the client.
  return new NodeLanguageClient(languageId, extensionTitle, serverOptions, clientOptions)
}

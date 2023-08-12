import type { ExtensionContext } from 'src/di'
import { activateExtension } from 'src/extension/activate'
import { fileExtensions, languageId } from 'src/meta'
import * as vscode from 'vscode'
import {
  LanguageClient as NodeLanguageClient,
  TransportKind,
  type LanguageClientOptions,
  type ServerOptions
} from 'vscode-languageclient/node'
import { mkReporter } from './telemetry'
import type TelemetryReporter from '@vscode/extension-telemetry'

let reporter: TelemetryReporter | undefined
let client: NodeLanguageClient | undefined

// this method is called when vs code is activated
export function activate(context: ExtensionContext) {
  reporter = mkReporter(context)
  client = createLanguageClient(context)

  void activateExtension({ client, context, reporter })
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
  void reporter?.dispose()
  return client?.dispose()
}

function createLanguageClient(context: ExtensionContext) {
  const serverModule = vscode.Uri.joinPath(
    context.extensionUri,
    'dist', 'lsp', 'node.js'
  ).fsPath
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: [
      '--nolazy',
      `--inspect${process.env['DEBUG_BREAK'] ? '-brk' : ''}=${process.env['DEBUG_SOCKET'] || '6009'
      }`
    ]
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  }

  const extensions = fileExtensions.map(s => s.substring(1)).join(',')
  const globPattern = `**/*.{${extensions}}`
  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
  context.subscriptions.push(fileSystemWatcher)

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { pattern: globPattern },
      { language: languageId }
    ],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher
    },
    progressOnInitialization: true
  }

  // Create the language client and start the client.
  return  new NodeLanguageClient(languageId, 'LikeC4 Extension', serverOptions, clientOptions)
}

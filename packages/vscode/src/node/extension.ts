import type { Scheme as LibScheme } from '@likec4/language-server/likec4lib'
import os from 'node:os'
import path from 'node:path'
import vscode from 'vscode'
import {
  type LanguageClientOptions,
  type ServerOptions,
  type TextDocumentFilter,
  LanguageClient as NodeLanguageClient,
  RevealOutputChannelOn,
  TransportKind,
} from 'vscode-languageclient/node'
import { isLikeC4Source } from '../common/initWorkspace'
import { extensionTitle, globPattern, isDev, isVirtual, languageId } from '../const'
import { ExtensionController } from '../ExtensionController'
import { configureLogger, logger } from '../logger'

function isWindows() {
  return os.platform() === 'win32'
}

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  const extensionOutputChannel = vscode.window.createOutputChannel('LikeC4 Extension', {
    log: true,
  })
  context.subscriptions.push(
    extensionOutputChannel,
  )
  configureLogger(extensionOutputChannel).then(() => {
    logger.info('createLanguageClient - node')
    const client = createLanguageClient(context)
    ExtensionController.activate(context, client, extensionOutputChannel)
  })
}

// This function is called when the extension is deactivated.
export function deactivate() {
  ExtensionController.deactivate()
}

function createLanguageClient(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('LikeC4 Language Server')
  context.subscriptions.push(
    outputChannel,
  )

  const serverModule = context.asAbsolutePath(
    path.join(
      'dist',
      'node',
      'language-server.js',
    ),
  )

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: ['--enable-source-maps'],
      },
    },
    debug: {
      module: serverModule,
      runtime: 'node',
      transport: TransportKind.ipc,
      options: {
        detached: false,
        execArgv: [
          '--enable-source-maps',
          '--nolazy',
          `--inspect${process.env['DEBUG_BREAK'] ? '-brk' : ''}=${process.env['DEBUG_SOCKET'] || '9229'}`,
        ],
      },
    },
  }

  if (isDev) {
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
      { language: languageId, scheme }, // TODO: Can't figure out why
    ]
    : workspaceFolders.map((f): TextDocumentFilter => {
      const w = vscode.Uri.joinPath(f.uri, globPattern)
      return { language: languageId, scheme, pattern: w.scheme === 'file' ? w.fsPath : w.path }
    })

  // Add the scheme for the likec4lib
  documentSelector.push({ language: languageId, scheme: 'vscode-remote' })
  documentSelector.push({ language: languageId, scheme: 'likec4builtin' satisfies typeof LibScheme })

  let fileSystemWatcher: vscode.FileSystemWatcher | undefined
  if (!isVirtual()) {
    fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
    context.subscriptions.push(fileSystemWatcher)
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    revealOutputChannelOn: isDev ? RevealOutputChannelOn.Info : RevealOutputChannelOn.Warn,
    outputChannel,
    documentSelector,
    diagnosticCollectionName: 'likec4',
    diagnosticPullOptions: {
      onTabs: true,
      match(_, resource) {
        return isLikeC4Source(resource.path)
      },
    },
    progressOnInitialization: true,
    synchronize: fileSystemWatcher
      ? {
        fileEvents: fileSystemWatcher,
      }
      : {},
  }
  logger.info('Document selector: { selector }', {
    selector: clientOptions.documentSelector,
  })

  // Create the language client and start the client.
  return new NodeLanguageClient(languageId, extensionTitle, serverOptions, clientOptions)
}

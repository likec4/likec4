import useDocumentSelector from '#useDocumentSelector'
import { watchDebounced } from '@reactive-vscode/vueuse'
import {
  defineService,
  extensionContext,
  onDeactivate,
  toValue,
  useDisposable,
} from 'reactive-vscode'
import { first, once } from 'remeda'
import * as vscode from 'vscode'
import {
  type LanguageClientOptions,
  type ServerOptions,
  LanguageClient as NodeLanguageClient,
  RevealOutputChannelOn,
  State,
  TransportKind,
} from 'vscode-languageclient/node'
import { config } from '../config'
import { globPattern, isVirtual } from '../const'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { isLikeC4Source } from '../utils.ts'

const useLanguageClient = defineService(() => {
  const { output } = useExtensionLogger()

  const serverModule = vscode.Uri.joinPath(
    extensionContext.value!.extensionUri,
    'dist',
    'node',
    'language-server.mjs',
  )

  // Computed once — changes require extension host restart (prompted by the watcher below)
  const nodeRuntime = config.node.path || 'node'

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: TransportKind.ipc,
      runtime: nodeRuntime,
      options: {
        execArgv: ['--enable-source-maps'],
      },
    },
    debug: {
      module: serverModule.fsPath,
      runtime: nodeRuntime,
      transport: TransportKind.ipc,
      options: {
        detached: false,
        env: {
          NODE_ENV: 'development',
        },
        execArgv: [
          '--enable-source-maps',
          '--nolazy',
          `--inspect${process.env['DEBUG_BREAK'] ? '-brk' : ''}=${process.env['DEBUG_SOCKET'] || '9229'}`,
        ],
      },
    },
  }

  let fileSystemWatcher: vscode.FileSystemWatcher | undefined
  if (!isVirtual()) {
    fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
    useDisposable(fileSystemWatcher)
  }

  const documentSelector = useDocumentSelector()

  const workspaceFolder = first(vscode.workspace.workspaceFolders ?? [])

  const clientOptions: LanguageClientOptions = {
    documentSelector: toValue(documentSelector) as any,
    outputChannel: useDisposable(vscode.window.createOutputChannel('LikeC4 Language Server', 'log')),
    diagnosticCollectionName: 'likec4',
    markdown: {
      isTrusted: true,
      supportHtml: true,
    },
    ...(workspaceFolder ? { workspaceFolder } : {}),
    diagnosticPullOptions: {
      onTabs: true,
      match(_, resource) {
        return isLikeC4Source(resource.path)
      },
    },
    synchronize: fileSystemWatcher
      ? {
        fileEvents: fileSystemWatcher,
      }
      : {},
  }

  const client = new NodeLanguageClient('likec4', 'LikeC4 Language Server', serverOptions, clientOptions)

  const suggestChangeNode = once(() => {
    const message =
      'Language server failed to start. This may be caused by an incompatible Node.js version. Please make sure you have Node.js 22.22 or later installed and configured in the extension settings.'
    output.error(message)
    output.show(true)
    vscode.window
      .showErrorMessage(
        message,
        'Configure Node',
      )
      .then(selection => {
        if (selection === 'Configure Node') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'likec4.node.path')
        }
      })
  })

  let hasReachedRunning = false

  const onDidChangeState = useDisposable(
    client.onDidChangeState(({ newState }) => {
      if (newState === State.Running) {
        hasReachedRunning = true
        // If the server is running for 5 seconds,
        // we can assume it started successfully and unsubscribe
        setTimeout(() => {
          if (client.isRunning()) {
            onDidChangeState.dispose()
          }
        }, 5000).unref()
      }
      // If the server never reached Running, suggest checking Node.js version
      if (newState === State.Stopped && !hasReachedRunning) {
        suggestChangeNode()
        onDidChangeState.dispose()
      }
    }),
  )

  let restartPromptPromise: PromiseLike<any> | undefined

  watchDebounced(() => config.node.path, () => {
    restartPromptPromise ??= vscode.window.showInformationMessage(
      'Run command "Restart Extension Host" to use the updated Node.js path',
      'Restart Now',
    ).then((selection) => {
      restartPromptPromise = undefined
      if (!selection) {
        return
      }
      vscode.commands.executeCommand('workbench.action.restartExtensionHost')
    })
  }, {
    debounce: 2_000,
  })

  onDeactivate(async () => {
    if (client.isRunning()) {
      await client.stop(1000)
    }
  })

  return useDisposable(client)
})

export default useLanguageClient

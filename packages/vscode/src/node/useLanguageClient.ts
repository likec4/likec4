import useDocumentSelector from '#useDocumentSelector'
import path from 'node:path'
import {
  createSingletonComposable,
  extensionContext,
  toValue,
  useDisposable,
  useOutputChannel,
} from 'reactive-vscode'
import vscode from 'vscode'
import {
  type LanguageClientOptions,
  type ServerOptions,
  LanguageClient as NodeLanguageClient,
  State,
  TransportKind,
} from 'vscode-languageclient/node'
import { isLikeC4Source } from '../common/initWorkspace'
import { useTelemetry } from '../common/useTelemetry'
import { globPattern, isVirtual } from '../const'
import { logger } from '../logger'

const useLanguageClient = createSingletonComposable(() => {
  const serverModule = extensionContext.value!.asAbsolutePath(
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

  let fileSystemWatcher: vscode.FileSystemWatcher | undefined
  if (!isVirtual()) {
    fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
    useDisposable(fileSystemWatcher)
  }

  const documentSelector = useDocumentSelector()

  const clientOptions: LanguageClientOptions = {
    documentSelector: toValue(documentSelector) as any,
    outputChannel: useOutputChannel('LikeC4 Language Server', 'log'),
    diagnosticCollectionName: 'likec4',
    markdown: {
      isTrusted: true,
      supportHtml: true,
    },
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

  // Create and start the language client.
  const client = new NodeLanguageClient('likec4', 'LikeC4 Language Server', serverOptions, clientOptions)

  return useDisposable(client)
})

export default useLanguageClient

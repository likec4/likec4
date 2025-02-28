import path from 'node:path'
import {
  defineExtension,
  extensionContext,
  useDisposable,
} from 'reactive-vscode'
import vscode from 'vscode'
import {
  type LanguageClientOptions,
  type ServerOptions,
  LanguageClient as NodeLanguageClient,
  TransportKind,
} from 'vscode-languageclient/node'
import { activateLanguageClient } from '../activate'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { useTelemetry } from '../common/useTelemetry'
import { globPattern, isVirtual } from '../const'
import { logger } from '../logger'

export const { activate, deactivate } = defineExtension(async () => {
  const { whenReady } = useExtensionLogger()
  await whenReady
  logger.debug('node extension')
  activateLanguageClient(
    // Create a language client
    (id, name, { documentSelector, ...opts }) => {
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

      const clientOptions: LanguageClientOptions = {
        ...opts,
        // @ts-expect-error
        documentSelector,
        synchronize: fileSystemWatcher
          ? {
            fileEvents: fileSystemWatcher,
          }
          : {},
      }

      // Create and start the language client.
      const client = new NodeLanguageClient(id, name, serverOptions, clientOptions)
      client.start()

      return client
    },
    // On Activated
    () => {
      useTelemetry().sendTelemetryEvent('activation', { extensionKind: 'node' })
    },
  )
})

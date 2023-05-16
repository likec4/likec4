import type { ExtensionRequirements } from 'src/di'
import { di } from 'src/di'
import { createInjector } from 'typed-inject'
import { dotLayout } from '@likec4/layouts'
import { C4ModelImpl } from 'src/c4model'
import { Logger } from 'src/logger'
import { PreviewPanel } from 'src/panels/PreviewPanel'
import { registerCommands } from './registerCommands'
import { registerPreviewPanelSerializer } from './registerWebviewSerializer'
import { initWorkspace } from './initWorkspace'

export async function activateExtension({ context, client }: ExtensionRequirements, isWebExtension = false) {
  await client.start()

  const logger = new Logger(client.outputChannel)

  const injector = createInjector()
    .provideValue(di.logger, logger)
    .provideValue(di.context, context)
    .provideValue(di.client, client)
    .provideValue(di.layout, dotLayout)
    .provideClass(di.c4model, C4ModelImpl)
    .provideClass(di.previewPanel, PreviewPanel)

  context.subscriptions.push(injector)

  injector.injectFunction(registerCommands)
  injector.injectFunction(registerPreviewPanelSerializer)

  if (isWebExtension) {
    // LSP web extensions does not have access to the file system (even virtual)
    // so we do this trick (find all files and open them)
    await initWorkspace(client, logger)
  }

  return injector
}

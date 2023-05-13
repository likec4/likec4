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

export async function activateExtension({ context, client }: ExtensionRequirements) {
  console.debug('activateExtension')

  await client.start()

  const injector = createInjector()
    .provideClass(di.logger, Logger)
    .provideValue(di.context, context)
    .provideValue(di.client, client)
    .provideValue(di.layout, dotLayout)
    .provideClass(di.c4model, C4ModelImpl)
    .provideClass(di.previewPanel, PreviewPanel)

  context.subscriptions.push(injector)

  injector.injectFunction(registerCommands)
  injector.injectFunction(registerPreviewPanelSerializer)

  await initWorkspace(client, injector.resolve(di.logger))

  return injector
}

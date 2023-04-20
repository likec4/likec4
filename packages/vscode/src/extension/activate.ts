import type { ExtensionRequirements } from 'src/di'
import { di } from 'src/di'
import { createInjector } from 'typed-inject'
import { initWorkspace } from './initWorkspace'
import { dotLayout } from '@likec4/layouts'
import { C4ModelImpl } from 'src/c4model'
import { PreviewPanel } from 'src/panels/PreviewPanel'
import { registerCommands } from './registerCommands'
import { registerPreviewPanelSerializer } from './registerWebviewSerializer'
import { BuiltinFS } from './builtinFileSystemProvider'

export async function activateExtension({ context, client }: ExtensionRequirements) {
  console.debug('activateExtension')

  const injector = createInjector()
    .provideValue(di.context, context)
    .provideValue(di.client, client)
    .provideValue(di.layout, dotLayout)
    .provideClass(di.c4model, C4ModelImpl)
    .provideClass(di.previewPanel, PreviewPanel)

  context.subscriptions.push(injector)

  await client.start()

  injector.injectFunction(registerCommands)
  injector.injectFunction(registerPreviewPanelSerializer)
  BuiltinFS.register(context)

  await initWorkspace(client)

  return injector
}

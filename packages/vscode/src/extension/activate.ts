import type { ExtensionRequirements } from '$/di'
import { di } from '$/di'
import { createInjector } from 'typed-inject'
// import { initWorkspace } from './initWorkspace'

export async function activateExtension({ context, client }: ExtensionRequirements) {

  const injector = createInjector()
    .provideValue(di.context, context)
    .provideValue(di.client, client)
    // .provideValue(di.layout, dotLayout)
    // .provideClass(di.c4model, C4ModelImpl)
    // .provideClass(di.previewPanel, PreviewPanel)

  context.subscriptions.push(injector)

  // injector.injectFunction(registerCommands)
  // injector.injectFunction(registerPreviewPanelSerializer)

  await client.start()
  // await injector.injectFunction(initWorkspace)

  return injector
}

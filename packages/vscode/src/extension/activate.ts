import { C4ModelImpl } from 'src/c4model'
import type { ExtensionRequirements } from 'src/di'
import { di } from 'src/di'
import { createLayoutFn } from 'src/layout'
import { Logger } from 'src/logger'
import { PreviewPanel } from 'src/panels/PreviewPanel'
import { createInjector } from 'typed-inject'
import { initWorkspace } from './initWorkspace'
import { registerCommands } from './registerCommands'
import { registerPreviewPanelSerializer } from './registerWebviewSerializer'
import { BaseError, isString, normalizeError, serializeError } from '@likec4/core'

export async function activateExtension(
  { context, client, reporter }: ExtensionRequirements,
  isWebExtension = false
) {
  console.info('activateExtension')
  reporter.sendTelemetryEvent('activation', { isWebExtension: isWebExtension.toString() })
  try {
    await client.start()

    const logger = new Logger(client.outputChannel, reporter)

    context.subscriptions.push(
      client.onTelemetry(event => {
        try {
          if (
            event != null &&
            typeof event === 'object' &&
            'eventName' in event &&
            typeof event.eventName === 'string'
          ) {
            const { eventName, ...rest } = event
            reporter.sendTelemetryEvent(eventName, rest)
            return
          }
          event = isString(event) ? { event } : event
          reporter.sendTelemetryEvent('lsp-telemetry', event)
        } catch (e) {
          const error = serializeError(e)
          console.error(`${error.name}: ${error.message}\n${error.stack}`)
        }
      })
    )

    const layoutFn = await createLayoutFn(logger)

    const injector = createInjector()
      .provideValue(di.logger, logger)
      .provideValue(di.context, context)
      .provideValue(di.client, client)
      .provideValue(di.layout, layoutFn)
      .provideValue(di.telemetry, reporter)
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
  } catch (e) {
    const error = serializeError(e)
    const message = `${error.name}: ${error.message}\n${error.stack}`
    reporter.sendDangerousTelemetryErrorEvent('activation-failed', { error: message })
    console.error(message)
    throw e
  }
}

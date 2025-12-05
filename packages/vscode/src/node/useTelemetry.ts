import useLanguageClient from '#useLanguageClient'
import { loggable } from '@likec4/log'
import { type TelemetryEventProperties, TelemetryReporter } from '@vscode/extension-telemetry'
import { deepEqual } from 'fast-equals'
import {
  type OnCleanup,
  createSingletonComposable,
  useDisposable,
  useIsTelemetryEnabled,
  watch,
} from 'reactive-vscode'
import { keys } from 'remeda'
import * as vscode from 'vscode'
import { isDev } from '../const'
import { useConfigureLogger } from '../useExtensionLogger'
import { whenExtensionActive } from '../useIsActivated'
import { useRpc } from '../useRpc'

// Application insights key (also known as instrumentation key)
const TelemetryConnectionString =
  'InstrumentationKey=36d9aa84-b503-45ea-ae34-b236e4f83bea;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=376f93d7-2977-4989-a2e7-d21b20b4984b' as const

const useTelemetry = createSingletonComposable(() => {
  const { logger, output, configureLogger } = useConfigureLogger()
  const reporter = useDisposable(new TelemetryReporter(TelemetryConnectionString))

  function sendTelemetry(eventName: string, properties?: TelemetryEventProperties) {
    if (isDev) {
      output.debug(`telemetry event skipped in dev mode`, eventName)
      return
    }
    reporter.sendTelemetryEvent(eventName, properties)
  }

  function sendTelemetryError(error: Error | Record<string, any>) {
    if (isDev) {
      output.debug(`telemetry error skipped in dev mode`)
      return
    }
    if (error instanceof Error) {
      reporter.sendTelemetryErrorEvent('error', {
        message: new vscode.TelemetryTrustedValue(error.message),
        stack: new vscode.TelemetryTrustedValue(error.stack || ''),
      })
      return
    }

    let message, stack
    if ('message' in error) {
      message = new vscode.TelemetryTrustedValue(error['message'])
    }
    if ('stack' in error) {
      stack = new vscode.TelemetryTrustedValue(error['stack'])
    }
    message ??= 'Unknown error'
    reporter.sendTelemetryErrorEvent('error', {
      ...error,
      message,
      stack,
    })
  }

  whenExtensionActive(() => {
    const client = useLanguageClient()
    useDisposable(client.onTelemetry((event) => {
      try {
        const { eventName = 'unnamed', ...properties } = event

        if (eventName === 'error') {
          // directly to output to avoid double emitting telemetry via logger with telemetry sink enabled
          output.error(`ServerError: ${properties.message}`, { ...properties })
          sendTelemetryError(properties)
          return
        }
        output.debug(`lsp telemetry`, { eventName, ...properties })
        sendTelemetry(eventName, properties)
      } catch (e) {
        console.error(loggable(e))
      }
    }))

    const enabled = useIsTelemetryEnabled()
    watch(enabled, (isEnabled, _, onCleanup) => {
      if (isEnabled) {
        logger.info('activate telemetry sink')
        configureLogger(reporter)

        activateTelemetry(reporter, onCleanup)
      }
    }, { immediate: true })
  })

  return {
    reporter,
    sendTelemetry,
    sendTelemetryError,
  }
})

export default useTelemetry

function activateTelemetry(telemetry: TelemetryReporter, onCleanup: OnCleanup) {
  const { logger: root, output } = useConfigureLogger()
  const logger = root.getChild('telemetry')
  const rpc = useRpc()

  async function fetchMetrics() {
    const t0 = performance.now()
    const { metrics } = await rpc.fetchMetrics()
    const t1 = performance.now()
    return {
      metrics,
      ms: Math.round(t1 - t0),
    }
  }

  let previousMetrics: Record<string, number> | null = null
  async function sendTelemetryMetrics() {
    try {
      if (isDev) {
        logger.debug('sendTelemetryMetrics skipped in dev mode')
        return
      }
      const { metrics, ms } = await fetchMetrics()
      if (!metrics) {
        logger.debug('no metrics returned from fetchMetrics')
        return
      }
      // if no metrics, do nothing
      const hasMetrics = keys(metrics).some(k => metrics[k] > 0)
      if (!hasMetrics) {
        logger.debug('no metrics with values greater than 0')
        return
      }
      const hasChanged = !previousMetrics || !deepEqual(previousMetrics, metrics)
      // if metrics are the same, do nothing
      if (!hasChanged) {
        logger.debug('metrics have not changed, skipping telemetry send')
        return
      }
      previousMetrics = metrics
      logger.debug(`send telemetry\n{data}`, { data: { ...metrics, ms } })
      telemetry.sendTelemetryEvent('model-metrics', {}, { ...metrics, ms })
    } catch (e) {
      output.error(loggable(e))
    }
  }

  logger.info(`turn on telemetry`)
  const Minute = 60_000
  // send first telemetry in 2 minutes
  const timeout = setTimeout(() => sendTelemetryMetrics(), 2 * Minute)

  // send telemetry every 1 hour
  const interval = setInterval(() => {
    void sendTelemetryMetrics()
  }, 60 * Minute)

  onCleanup(() => {
    logger.info(`turn off telemetry`)
    clearInterval(interval)
    clearTimeout(timeout)
  })

  return telemetry
}

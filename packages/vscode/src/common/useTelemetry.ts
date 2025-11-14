import { loggable } from '@likec4/log'
import { TelemetryReporter } from '@vscode/extension-telemetry'
import { deepEqual } from 'fast-equals'
import {
  type OnCleanup,
  computed,
  createSingletonComposable,
  onEffectCleanup,
  useDisposable,
  useIsTelemetryEnabled,
  watch,
} from 'reactive-vscode'
import { keys } from 'remeda'
import * as vscode from 'vscode'
import { isDev } from '../const'
import { configureLogger } from '../logger'
import { useRpc } from '../Rpc'
import { useExtensionLogger } from './useExtensionLogger'
import { useIsActivated } from './useIsActivated'

// Application insights key (also known as instrumentation key)
const TelemetryConnectionString =
  'InstrumentationKey=36d9aa84-b503-45ea-ae34-b236e4f83bea;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=376f93d7-2977-4989-a2e7-d21b20b4984b' as const

export const useTelemetry = createSingletonComposable(() => {
  const reporter = useDisposable(new TelemetryReporter(TelemetryConnectionString))
  const enabled = useIsTelemetryEnabled()
  const activated = useIsActivated()

  const isEnabled = computed(() => enabled.value && activated.value)

  watch(isEnabled, (enable, prev, onCleanup) => {
    if (enable) {
      activateTelemetry(reporter, onCleanup)
    }
  })
  return reporter
})

function activateTelemetry(telemetry: TelemetryReporter, onCleanup: OnCleanup) {
  const { logger: root, loggerOutput } = useExtensionLogger()
  const logger = root.getChild('telemetry')
  const rpc = useRpc()

  configureLogger(telemetry)

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
        return
      }
      // if no metrics, do nothing
      const hasMetrics = keys(metrics).some(k => metrics[k] > 0)
      if (!hasMetrics) {
        return
      }
      const hasChanged = !previousMetrics || !deepEqual(previousMetrics, metrics)
      // if metrics are the same, do nothing
      if (!hasChanged) {
        return
      }
      previousMetrics = metrics
      logger.debug(`send\n{data}`, { data: { ...metrics, ms } })
      telemetry.sendTelemetryEvent('model-metrics', {}, { ...metrics, ms })
    } catch (e) {
      loggerOutput.error(loggable(e))
    }
  }

  logger.info(`turn on telemetry`)
  const Minute = 60_000
  // send first telemetry in 5 minutes
  const timeout = setTimeout(() => sendTelemetryMetrics(), 5 * Minute)

  // send telemetry every 1 hour
  const interval = setInterval(() => {
    void sendTelemetryMetrics()
  }, 60 * Minute)

  const disposable = rpc.client.onTelemetry((event) => {
    try {
      const { eventName, ...properties } = event
      if (eventName === 'error') {
        loggerOutput.error(`ServerError: ${properties.message}`, { ...properties })

        if ('stack' in properties) {
          properties.stack = new vscode.TelemetryTrustedValue(properties.stack)
        }
        if ('message' in properties) {
          properties.message = new vscode.TelemetryTrustedValue(properties.message)
        }

        telemetry.sendTelemetryErrorEvent('error', properties)
        return
      }
      logger.debug(`onTelemetry: {eventName}`, { eventName })
      telemetry.sendTelemetryEvent(eventName, properties)
    } catch (e) {
      loggerOutput.error(loggable(e))
    }
  })

  onCleanup(() => {
    loggerOutput.info(`turn off telemetry`)
    configureLogger()
    disposable.dispose()
    clearInterval(interval)
    clearTimeout(timeout)
  })

  return telemetry
}

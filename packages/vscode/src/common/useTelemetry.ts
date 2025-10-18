import { TelemetryReporter } from '@vscode/extension-telemetry'
import { deepEqual } from 'fast-equals'
import {
  createSingletonComposable,
  tryOnScopeDispose,
  useDisposable,
  useIsTelemetryEnabled,
  watch,
} from 'reactive-vscode'
import { keys } from 'remeda'
import { isDev } from '../const'
import { logger as root, logWarn } from '../logger'
import { useRpc } from '../Rpc'
import { whenExtensionActive } from './useIsActivated'

// Application insights key (also known as instrumentation key)
const TelemetryConnectionString =
  'InstrumentationKey=36d9aa84-b503-45ea-ae34-b236e4f83bea;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=376f93d7-2977-4989-a2e7-d21b20b4984b' as const

const logger = root.getChild('telemetry')

export const useTelemetry = createSingletonComposable(() => {
  const reporter = useDisposable(new TelemetryReporter(TelemetryConnectionString))
  const isEnabled = useIsTelemetryEnabled()
  whenExtensionActive({
    onStart() {
      watch(isEnabled, (_isEnabled) => {
        if (!_isEnabled) {
          logger.debug('telemetry disabled')
          return
        }
        if (isDev) {
          logger.debug('useTelemetry activation (dev)')
          return
        }
        logger.debug('useTelemetry activation')
        activateTelemetry(reporter)
      }, {
        immediate: true,
      })
    },
    onStop() {
      logger.info('telemetry stopped')
    },
  })
  return reporter
})

function activateTelemetry(telemetry: TelemetryReporter) {
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
      logWarn(e)
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

  tryOnScopeDispose(() => {
    clearInterval(interval)
    clearTimeout(timeout)
  })

  return telemetry
}

import TelemetryReporter from '@vscode/extension-telemetry'
import { deepEqual } from 'fast-equals'
import { tryOnScopeDispose } from 'reactive-vscode'
import { keys } from 'remeda'
import { logger as root, logWarn } from '../logger'
import type { Rpc } from '../Rpc'

// Application insights key (also known as instrumentation key)
const TelemetryConnectionString =
  'InstrumentationKey=36d9aa84-b503-45ea-ae34-b236e4f83bea;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=376f93d7-2977-4989-a2e7-d21b20b4984b' as const

let instance: TelemetryReporter | null = null

export const useTelemetry = () => {
  return instance ??= new TelemetryReporter(TelemetryConnectionString)
}

const logger = root.getChild('telemetry')

export function activateTelemetry(rpc: Rpc) {
  const telemetry = useTelemetry()

  async function fetchMetrics() {
    const t0 = performance.now()
    const { model } = await rpc.fetchComputedModel(true)
    const t1 = performance.now()
    return {
      metrics: model
        ? {
          elementKinds: keys(model.specification.elements).length,
          relationshipKinds: keys(model.specification.relationships).length,
          tags: keys(model.specification.tags).length,
          elements: keys(model.elements).length,
          relationships: keys(model.relations).length,
          views: keys(model.views).length,
        }
        : null,
      ms: Math.round(t1 - t0),
    }
  }

  let previousMetrics: Record<string, number> | null = null
  async function sendTelemetryMetrics() {
    try {
      // if telemetry is off, do nothing
      if (telemetry.telemetryLevel === 'off') {
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
      logWarn(e)
    }
  }

  logger.info(`turn on telemetry`)
  const Minute = 60_000
  // send first telemetry in 1 minute
  setTimeout(() => sendTelemetryMetrics(), Minute)

  // send telemetry every 30 minutes
  const interval = setInterval(() => {
    sendTelemetryMetrics()
  }, 30 * Minute)

  tryOnScopeDispose(() => clearInterval(interval))

  return telemetry
}

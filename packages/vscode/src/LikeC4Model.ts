import type { ComputedLikeC4Model, ViewId as ViewID } from '@likec4/core'
import { deepEqual } from 'fast-equals'
import prettyMilliseconds from 'pretty-ms'
import { keys } from 'remeda'
import { isDev } from './const'
import type { ExtensionController } from './ExtensionController'
import { logger } from './logger'
import { AbstractDisposable } from './util'

export class LikeC4Model extends AbstractDisposable {
  private computedModelPromise: Promise<{ model: ComputedLikeC4Model | null }> | undefined

  constructor(
    private ctrl: ExtensionController,
  ) {
    super()

    this.onDispose(
      ctrl.rpc.onDidChangeModel(() => {
        this.computedModelPromise = undefined
        this.ctrl.messenger.notifyModelUpdate()
      }),
    )
  }

  public async fetchComputedModel() {
    this.computedModelPromise ??= Promise.resolve().then(() => this.fetchModelAndUpdateCaches())
    return await this.computedModelPromise
  }

  private async fetchModelAndUpdateCaches() {
    const mark = performance.mark('fetchComputedModel:start')
    const model = await this.ctrl.rpc.fetchComputedModel()
    if (isDev) {
      const measure = performance.measure('FetchComputedModel', mark)
      logger.debug(`[LikeC4Model.fetchComputedModel] ${prettyMilliseconds(measure.duration)}`)
    }
    return { model }
  }

  public async layoutView(viewId: ViewID) {
    const { result } = await this.ctrl.rpc.layoutView(viewId)
    return result
  }

  override dispose() {
    super.dispose()
    logger.debug(`[LikeC4Model] disposed`)
  }

  public turnOnTelemetry() {
    logger.info(`[LikeC4Model] turnOnTelemetry`)
    const Minute = 60_000
    // send first telemetry in 1 minute
    setTimeout(() => this.sendTelemetryMetrics(), Minute)

    // send telemetry every 30 minutes
    const interval = setInterval(() => {
      this.sendTelemetryMetrics()
    }, 30 * Minute)
    this.onDispose(() => clearInterval(interval))
  }

  private previousMetrics: Record<string, number> | null = null
  private async sendTelemetryMetrics() {
    try {
      // if telemetry is off, do nothing
      if (!this.ctrl.telemetry) {
        return
      }
      const { metrics, ms } = await this.fetchMetrics()
      if (!metrics) {
        return
      }
      // if no metrics, do nothing
      const hasMetrics = keys(metrics).some(k => metrics[k] > 0)
      if (!hasMetrics) {
        return
      }
      const hasChanged = !this.previousMetrics || !deepEqual(this.previousMetrics, metrics)
      // if metrics are the same, do nothing
      if (!hasChanged) {
        return
      }
      this.previousMetrics = metrics
      logger.debug(`[LikeC4Model] send telemetry`, { ...metrics, ms })
      this.ctrl.telemetry.sendTelemetryEvent('model-metrics', {}, { ...metrics, ms })
    } catch (e) {
      logger.warn(e)
    }
  }

  private async fetchMetrics() {
    const t0 = performance.now()
    const model = await this.ctrl.rpc.fetchComputedModel(true)
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
}

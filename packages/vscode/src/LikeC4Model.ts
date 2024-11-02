import type { ComputedLikeC4Model, ComputedView, ViewID } from '@likec4/core'
import type { LayoutResult } from '@likec4/layouts'
import { isDeepEqual, keys, values } from 'remeda'
import vscode from 'vscode'
import type { ExtensionController } from './ExtensionController'
import { logger } from './logger'
import { AbstractDisposable } from './util'

export class LikeC4Model extends AbstractDisposable {
  private computedViews = new Map<ViewID, ComputedView>()

  private cachedDiagrams = new WeakMap<ComputedView, LayoutResult>()

  private computedModelPromise: Promise<{ model: ComputedLikeC4Model | null }> | undefined

  private viewsWithReportedErrors = new Set<ViewID>()

  constructor(
    private ctrl: ExtensionController
  ) {
    super()

    this.onDispose(
      ctrl.rpc.onDidChangeModel(() => {
        this.computedModelPromise = undefined
        this.ctrl.messenger.notifyModelUpdate()
      })
    )
  }

  public fetchComputedModel() {
    this.computedModelPromise ??= Promise.resolve().then(() => this.fetchModelAndUpdateCaches())
    return this.computedModelPromise
  }

  private async fetchModelAndUpdateCaches() {
    const model = await this.ctrl.rpc.fetchComputedModel()
    if (model) {
      for (const view of values(model.views)) {
        let current = this.computedViews.get(view.id)
        if (!current || !isDeepEqual(current, view)) {
          this.computedViews.set(view.id, view)
        }
      }
    }
    return { model }
  }

  public async layoutView(viewId: ViewID) {
    const { model } = await this.fetchComputedModel()
    const latest = model?.views[viewId]
    if (!latest) {
      return null
    }
    const computedView = this.computedViews.get(viewId) ?? latest
    let layoutedView = this.cachedDiagrams.get(computedView)
    if (!layoutedView) {
      try {
        layoutedView = await this.ctrl.graphviz.layout(computedView)
        if (!layoutedView) {
          return null
        }
        this.viewsWithReportedErrors.delete(viewId)
        this.cachedDiagrams.set(computedView, layoutedView)
      } catch (err) {
        if (!this.viewsWithReportedErrors.has(viewId)) {
          const errMessage = err instanceof Error
            ? (err.stack ?? err.message)
            : '' + err
          vscode.window.showErrorMessage(`LikeC4: ${errMessage}`)
          this.viewsWithReportedErrors.add(viewId)
        }
        logger.warn(`[LikeC4Model.layoutView] failed ${viewId}`, err)
        return Promise.reject(err)
      }
    }
    return layoutedView
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
      const hasChanged = !this.previousMetrics || !isDeepEqual(this.previousMetrics, metrics)
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
          views: keys(model.views).length
        }
        : null,
      ms: Math.round(t1 - t0)
    }
  }
}

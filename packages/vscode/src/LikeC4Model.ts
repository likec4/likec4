import type { ComputedLikeC4Model, ComputedView, ViewID } from '@likec4/core'

import type { LayoutResult } from '@likec4/layouts'
import { isDeepEqual, values } from 'remeda'
import type { ExtensionController } from './ExtensionController'
import { AbstractDisposable } from './util'

export class LikeC4Model extends AbstractDisposable {
  private computedViews = new Map<ViewID, ComputedView>()

  private cachedDiagrams = new WeakMap<ComputedView, LayoutResult>()

  private computedModelPromise: Promise<{ model: ComputedLikeC4Model | null }> | undefined

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
      layoutedView = await this.ctrl.graphviz.layout(computedView)
      if (!layoutedView) {
        return null
      }
      this.cachedDiagrams.set(computedView, layoutedView)
    }
    return layoutedView
  }

  // override dispose() {
  //   super.dispose()
  //   logger.debug(`[C4Model] disposed`)
  // }

  // private fetchView(viewId: ViewID) {
  //   logger.debug(`[C4Model] fetchView ${viewId}`)
  //   const promise = this.ctrl.rpc.computeView(viewId)
  //   return xs
  //     .fromPromise(pTimeout(promise, {
  //       milliseconds: 15_000,
  //       message: `fetchView ${viewId} timeout`
  //     }))
  // }

  // private layoutView(view: ComputedView) {
  //   logger.debug(`[C4Model] layoutView ${view.id}`)
  //   const promise = Promise.resolve().then(() => this.ctrl.graphviz.layout(view))
  //   return xs.fromPromise(pTimeout(promise, {
  //     milliseconds: 15_000,
  //     message: `layoutView ${view.id} timeout`
  //   }))
  // }

  // public subscribeToView(viewId: ViewID, callback: (result: Callback) => void) {
  //   this.viewsWithReportedErrors.delete(viewId)
  //   logger.debug(`[C4Model.subscribe] >> ${viewId}`)
  //   let t1 = null as null | number
  //   const subscription = this.changesStream
  //     .map(() => this.fetchView(viewId))
  //     .flatten()
  //     .compose(dropRepeats<ComputedView | null>(equals))
  //     .map(view => {
  //       if (!view) {
  //         callback({
  //           success: false,
  //           error: 'View not found'
  //         })
  //       }
  //       return view
  //     })
  //     .filter(isNotNullish)
  //     .map(view => {
  //       t1 = performance.now()
  //       return this.layoutView(view)
  //     })
  //     .flatten()
  //     .subscribe({
  //       next: ({ diagram }: DotLayoutResult) => {
  //         if (t1) {
  //           const ms = (performance.now() - t1).toFixed(3)
  //           logger.debug(`[C4Model.layoutView] ${viewId} in ${ms}ms`)
  //           t1 = null
  //         }
  //         this.viewsWithReportedErrors.delete(viewId)
  //         callback({
  //           success: true,
  //           diagram
  //         })
  //       },
  //       error: err => {
  //         const errMessage = err instanceof Error
  //           ? (err.stack ?? err.name + ': ' + err.message)
  //           : '' + err
  //         if (t1) {
  //           const ms = (performance.now() - t1).toFixed(3)
  //           logger.warn(
  //             `[C4Model.layoutView] failed ${viewId} in ${ms}ms\n${errMessage}`
  //           )
  //           t1 = null
  //         } else {
  //           logError(err)
  //         }
  //         if (!this.viewsWithReportedErrors.has(viewId)) {
  //           vscode.window.showErrorMessage(`LikeC4: ${errMessage}`)
  //           this.viewsWithReportedErrors.add(viewId)
  //         }

  //         callback({
  //           success: false,
  //           error: errMessage
  //         })
  //       }
  //     })

  //   return disposable(() => {
  //     logger.debug(`[C4Model.unsubscribe] -- ${viewId}`)
  //     subscription.unsubscribe()
  //   })
  // }

  // public turnOnTelemetry() {
  //   logger.debug(`[C4Model] turnOnTelemetry`)
  //   const Minute = 60_000
  //   const telemetry = xs
  //     .periodic(30 * Minute)
  //     .drop(1)
  //     .map(() => xs.from(this.fetchTelemetry()))
  //     .flatten()
  //     .compose(dropRepeats((a, b) => equals(a.metrics, b.metrics)))
  //     .map(({ metrics, ms }) => (metrics ? { ...metrics, ms } : null))
  //     .filter(isNotNullish)
  //     .subscribe({
  //       next: metrics => {
  //         this.sendTelemetry(metrics)
  //       },
  //       error: err => {
  //         logWarn(err)
  //       }
  //     })
  //   this.onDispose(() => telemetry.unsubscribe())
  // }

  // private async fetchTelemetry() {
  //   const t0 = performance.now()
  //   await rebuildWorkspace(this.ctrl.rpc)
  //   const model = await this.ctrl.rpc.fetchComputedModel()
  //   const t1 = performance.now()
  //   return {
  //     metrics: model
  //       ? {
  //         elements: Object.keys(model.elements).length,
  //         relationships: Object.keys(model.relations).length,
  //         views: Object.keys(model.views).length
  //       }
  //       : null,
  //     ms: t1 - t0
  //   }
  // }

  // private sendTelemetry(measurements: TelemetryEventMeasurements) {
  //   try {
  //     this.ctrl.telemetry?.sendTelemetryEvent('model-metrics', {}, measurements)
  //     logger.debug(`[C4Model] send telemetry`)
  //   } catch (e) {
  //     logWarn(e)
  //   }
  // }
}

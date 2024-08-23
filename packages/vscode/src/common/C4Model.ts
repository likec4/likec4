import type { ComputedView, DiagramView as LayoutedView, ViewID } from '@likec4/core'
import { invariant } from '@likec4/core'
import type { TelemetryEventMeasurements } from '@vscode/extension-telemetry'
import { deepEqual as equals } from 'fast-equals'
import pTimeout from 'p-timeout'
import * as vscode from 'vscode'
import type { MemoryStream } from 'xstream'
import xs from 'xstream'

import type { DotLayoutResult } from '@likec4/layouts'
import dropRepeats from 'xstream/extra/dropRepeats'
import { logError, logger } from '../logger'
import { AbstractDisposable, disposable } from '../util'
import type { ExtensionController } from './ExtensionController'
import { rebuildWorkspace } from './initWorkspace'

function isNotNullish<T>(x: T): x is NonNullable<T> {
  return x !== undefined && x !== null
}

type Callback =
  | {
    success: true
    diagram: LayoutedView
    error?: never
  }
  | {
    success: false
    diagram?: never
    error: string
  }
export class C4Model extends AbstractDisposable {
  #activeSubscription: vscode.Disposable | null = null

  private changesStream: MemoryStream<number>

  private viewsWithReportedErrors = new Set<ViewID>()

  constructor(
    private ctrl: ExtensionController
  ) {
    super()
    this.changesStream = xs
      .create<number>({
        start: listener => {
          invariant(this.#activeSubscription == null, 'changesStream already started')
          logger.debug('[C4Model.changes] subscribe onDidChangeModel')
          let changes = 0
          const unsubscribe = this.ctrl.rpc.onDidChangeModel(() => {
            listener.next(changes++)
          })
          this.#activeSubscription = disposable(() => {
            this.#activeSubscription = null
            unsubscribe.dispose()
            listener.complete()
            logger.debug('[C4Model.changes] unsubscribe onDidChangeModel')
          })
        },
        stop: () => {
          logger.debug('[C4Model.changes] stop')
          this.#activeSubscription?.dispose()
        }
      })
      .startWith(0)

    this.onDispose(() => {
      this.#activeSubscription?.dispose()
    })
    logger.debug(`[C4Model] created`)
  }

  override dispose() {
    super.dispose()
    logger.debug(`[C4Model] disposed`)
  }

  private fetchView(viewId: ViewID) {
    logger.debug(`[C4Model] fetchView ${viewId}`)
    const promise = this.ctrl.rpc.computeView(viewId)
    return xs
      .fromPromise(pTimeout(promise, {
        milliseconds: 15_000,
        message: `fetchView ${viewId} timeout`
      }))
  }

  private layoutView(view: ComputedView) {
    logger.debug(`[C4Model] layoutView ${view.id}`)
    const promise = Promise.resolve().then(() => this.ctrl.graphviz.layout(view))
    return xs.fromPromise(pTimeout(promise, {
      milliseconds: 15_000,
      message: `layoutView ${view.id} timeout`
    }))
  }

  public subscribeToView(viewId: ViewID, callback: (result: Callback) => void) {
    this.viewsWithReportedErrors.delete(viewId)
    logger.debug(`[C4Model.subscribe] >> ${viewId}`)
    let t1 = null as null | number
    const subscription = this.changesStream
      .map(() => this.fetchView(viewId))
      .flatten()
      .compose(dropRepeats<ComputedView | null>(equals))
      .map(view => {
        if (!view) {
          callback({
            success: false,
            error: 'View not found'
          })
        }
        return view
      })
      .filter(isNotNullish)
      .map(view => {
        t1 = performance.now()
        return this.layoutView(view)
      })
      .flatten()
      .subscribe({
        next: ({ diagram }: DotLayoutResult) => {
          if (t1) {
            const ms = (performance.now() - t1).toFixed(3)
            logger.debug(`[C4Model.layoutView] ${viewId} in ${ms}ms`)
            t1 = null
          }
          this.viewsWithReportedErrors.delete(viewId)
          callback({
            success: true,
            diagram
          })
        },
        error: err => {
          const errMessage = err instanceof Error
            ? (err.stack ?? err.name + ': ' + err.message)
            : '' + err
          if (t1) {
            const ms = (performance.now() - t1).toFixed(3)
            logger.warn(
              `[C4Model.layoutView] failed ${viewId} in ${ms}ms\n${errMessage}`
            )
            t1 = null
          } else {
            logError(err)
          }
          if (!this.viewsWithReportedErrors.has(viewId)) {
            vscode.window.showErrorMessage(`LikeC4: ${errMessage}`)
            this.viewsWithReportedErrors.add(viewId)
          }

          callback({
            success: false,
            error: errMessage
          })
        }
      })

    return disposable(() => {
      logger.debug(`[C4Model.unsubscribe] -- ${viewId}`)
      subscription.unsubscribe()
    })
  }

  public turnOnTelemetry() {
    logger.debug(`[C4Model] turnOnTelemetry`)
    const Minute = 60_000
    const telemetry = xs
      .periodic(30 * Minute)
      .drop(1)
      .map(() => xs.from(this.fetchTelemetry()))
      .flatten()
      .compose(dropRepeats((a, b) => equals(a.metrics, b.metrics)))
      .map(({ metrics, ms }) => (metrics ? { ...metrics, ms } : null))
      .filter(isNotNullish)
      .subscribe({
        next: metrics => {
          this.sendTelemetry(metrics)
        },
        error: err => {
          logError(err)
        }
      })
    this.onDispose(() => telemetry.unsubscribe())
  }

  private async fetchTelemetry() {
    await rebuildWorkspace(this.ctrl.rpc)
    const t0 = performance.now()
    const model = await this.ctrl.rpc.fetchComputedModel()
    const t1 = performance.now()
    return {
      metrics: model
        ? {
          elements: Object.keys(model.elements).length,
          relationships: Object.keys(model.relations).length,
          views: Object.keys(model.views).length
        }
        : null,
      ms: t1 - t0
    }
  }

  private sendTelemetry(measurements: TelemetryEventMeasurements) {
    try {
      this.ctrl.telemetry?.sendTelemetryEvent('model-metrics', {}, measurements)
      logger.debug(`[C4Model] send telemetry`)
    } catch (e) {
      logError(e)
    }
  }
}

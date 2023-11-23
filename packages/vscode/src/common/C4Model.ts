import type { ComputedView, DiagramView as LayoutedView, ViewID } from '@likec4/core'
import { invariant, serializeError } from '@likec4/core'
import { DotLayouter } from '@likec4/layouts'
import type TelemetryReporter from '@vscode/extension-telemetry'
import type { TelemetryEventMeasurements } from '@vscode/extension-telemetry'
import { equals } from 'rambdax'
import type * as vscode from 'vscode'
import type { MemoryStream } from 'xstream'
import xs from 'xstream'
import debounce from 'xstream/extra/debounce'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Logger, logError } from '../logger'
import { AbstractDisposable, disposable } from '../util'
import type { Rpc } from './Rpc'

function isNotNullish<T>(x: T): x is NonNullable<T> {
  return x !== undefined && x !== null
}

// const StateKeyLikeC4Model = 'c4model:last:views'

export class C4Model extends AbstractDisposable {
  #activeSubscription: vscode.Disposable | null = null

  private changesStream: MemoryStream<number>

  private dot: DotLayouter

  constructor(
    private rpc: Rpc,
    private telemetry: TelemetryReporter
  ) {
    super()
    this.dot = new DotLayouter()
    this.onDispose(this.dot)
    this.changesStream = xs
      .create<number>({
        start: listener => {
          invariant(this.#activeSubscription == null, 'changesStream already started')
          Logger.info('[Extension.C4Model.changesStream] subscribe onDidChangeModel')
          let changes = 0
          const unsubscribe = this.rpc.onDidChangeModel(() => {
            listener.next(changes++)
          })
          this.#activeSubscription = disposable(() => {
            this.#activeSubscription = null
            Logger.info('[Extension.C4Model.changesStream] unsubscribe onDidChangeModel')
            unsubscribe.dispose()
            listener.complete()
          })
        },
        stop: () => {
          Logger.info('[Extension.C4Model.changesStream] stop')
          this.#activeSubscription?.dispose()
        }
      })
      .compose(debounce(200))
      .startWith(0)

    this.onDispose(() => {
      this.#activeSubscription?.dispose()
    })
    Logger.info(`[Extension.C4Model] created`)
  }

  override dispose() {
    super.dispose()
    Logger.info(`[Extension.C4Model] disposed`)
  }

  private fetchModel() {
    Logger.info(`[Extension.C4Model] fetchModel`)
    return xs
      .fromPromise(this.rpc.fetchModel())
      .filter(isNotNullish)
      .replaceError(err => {
        logError(err)
        return xs.empty()
      })
  }

  private fetchView(viewId: ViewID) {
    Logger.info(`[Extension.C4Model] fetchView ${viewId}`)
    // microtask
    const promise = Promise.resolve().then(() => this.rpc.computeView(viewId))
    return xs.fromPromise(promise)
    // .filter(isNotNullish)
    // .replaceError(err => {
    //   logError(err)
    //   return xs.empty()
    // })
  }

  private layoutView(view: ComputedView) {
    // microtask
    const promise = Promise.resolve()
      .then(() => this.dot.layout(view))
      .then(({ diagram }) => diagram)
      .catch(err => {
        Logger.warn(serializeError(err).message)
        return Promise.reject(err)
      })
    return xs.from(promise).replaceError(err => {
      logError(err)
      return xs.empty()
    })
  }

  public subscribeToView(viewId: ViewID, callback: (diagram: LayoutedView | null) => void) {
    Logger.info(`[Extension.C4Model.subscribe] >> ${viewId}`)
    const subscription = this.changesStream
      .map(() => this.fetchView(viewId))
      .flatten()
      .replaceError(err => {
        logError(err)
        callback(null)
        return xs.empty()
      })
      .compose(dropRepeats<ComputedView | null>(equals))
      .map(view => {
        if (!view) {
          callback(null)
          return xs.empty()
        }
        return this.layoutView(view)
      })
      .flatten()
      .subscribe({
        next: diagram => callback(diagram),
        error: err => {
          callback(null)
          logError(err)
        }
      })

    return disposable(() => {
      Logger.info(`[Extension.C4Model.unsubscribe] -- ${viewId}`)
      subscription.unsubscribe()
    })
  }

  public turnOnTelemetry() {
    Logger.info(`[Extension.C4Model] turnOnTelemetry`)
    const Minute = 1000 * 60
    const telemetry = xs
      .periodic(20 * Minute)
      .drop(1)
      .map(() => xs.from(this.fetchTelemetry()))
      .replaceError(err => {
        logError(err)
        return xs.empty()
      })
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
    const t0 = performance.now()
    const model = await this.rpc.fetchModel()
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
      this.telemetry.sendTelemetryEvent('model-metrics', {}, measurements)
      Logger.info(`[Extension.C4Model] send telemetry`)
    } catch (e) {
      logError(e)
    }
  }
}

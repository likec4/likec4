import type { ComputedView, DiagramView as LayoutedView, ViewID } from '@likec4/core'
import { invariant } from '@likec4/core'
import type TelemetryReporter from '@vscode/extension-telemetry'
import type { TelemetryEventMeasurements } from '@vscode/extension-telemetry'
import { deepEqual as equals } from 'fast-equals'
import pTimeout from 'p-timeout'
import * as vscode from 'vscode'
import type { MemoryStream } from 'xstream'
import xs from 'xstream'

import type { ChangeViewRequestParams } from '@likec4/language-server/protocol'
import type { DotLayoutResult } from '@likec4/layouts'
import dropRepeats from 'xstream/extra/dropRepeats'
import { logError, Logger } from '../logger'
import { AbstractDisposable, disposable } from '../util'
import type { ExtensionController } from './ExtensionController'
import { PreviewPanel } from './panel/PreviewPanel'
import type { Rpc } from './Rpc'

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

  constructor(
    private ctrl: ExtensionController,
    private rpc: Rpc,
    private telemetry: TelemetryReporter
  ) {
    super()
    this.changesStream = xs
      .create<number>({
        start: listener => {
          invariant(this.#activeSubscription == null, 'changesStream already started')
          Logger.debug('[Extension.C4Model.changes] subscribe onDidChangeModel')
          let changes = 0
          const unsubscribe = this.rpc.onDidChangeModel(() => {
            listener.next(changes++)
          })
          this.#activeSubscription = disposable(() => {
            this.#activeSubscription = null
            unsubscribe.dispose()
            listener.complete()
            Logger.debug('[Extension.C4Model.changes] unsubscribe onDidChangeModel')
          })
        },
        stop: () => {
          Logger.debug('[Extension.C4Model.changes] stop')
          this.#activeSubscription?.dispose()
        }
      })
      .startWith(0)

    this.onDispose(() => {
      this.#activeSubscription?.dispose()
    })
    Logger.debug(`[Extension.C4Model] created`)
  }

  override dispose() {
    super.dispose()
    Logger.debug(`[Extension.C4Model] disposed`)
  }

  private fetchView(viewId: ViewID) {
    Logger.debug(`[Extension.C4Model] fetchView ${viewId}`)
    const promise = this.rpc.computeView(viewId)
    return xs
      .fromPromise(pTimeout(promise, {
        milliseconds: 15_000,
        fallback: () => {
          vscode.window.showErrorMessage(`LikeC4: Fetch view ${viewId} timed out`)
          return null
        }
      }))
  }

  private layoutView(view: ComputedView) {
    Logger.debug(`[Extension.C4Model] layoutView ${view.id}`)
    const promise = Promise.resolve().then(() => this.ctrl.graphviz.layout(view))
    return xs.fromPromise(pTimeout(promise, {
      milliseconds: 15_000,
      message: `layoutView ${view.id} timeout`
    }))
  }

  public subscribeToView(viewId: ViewID, callback: (result: Callback) => void) {
    Logger.debug(`[Extension.C4Model.subscribe] >> ${viewId}`)
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
            Logger.debug(`[Extension.C4Model.layoutView] ${viewId} in ${ms}ms`)
            t1 = null
          }
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
            Logger.warn(
              `[Extension.C4Model.layoutView] failed ${viewId} in ${ms}ms\n${errMessage}`
            )
            t1 = null
          } else {
            logError(err)
          }

          callback({
            success: false,
            error: errMessage
          })
        }
      })

    return disposable(() => {
      Logger.debug(`[Extension.C4Model.unsubscribe] -- ${viewId}`)
      subscription.unsubscribe()
    })
  }

  public async changeView({ viewId, change }: ChangeViewRequestParams) {
    // Logger.debug(`[Messenger] onChange: ${JSON.stringify(params.changes, null, 4)}`)
    let loc = await this.rpc.changeView({ viewId, change })
    if (loc) {
      const location = this.rpc.client.protocol2CodeConverter.asLocation(loc)
      const previewColumn = PreviewPanel.current?.panel.viewColumn ?? vscode.ViewColumn.One

      const editor = await vscode.window.showTextDocument(location.uri, {
        viewColumn: previewColumn >= 2 ? previewColumn - 1 : vscode.ViewColumn.Beside,
        selection: location.range
      })
      editor.revealRange(location.range, vscode.TextEditorRevealType.InCenter)
      await vscode.workspace.save(location.uri)

      if (change.op === 'save-manual-layout' && this.ctrl.shouldInformAboutManualLayout()) {
        setTimeout(() => {
          vscode.window.showInformationMessage(
            'Manual layouts are still experimental and may not work as expected. You can disable experimental features in settings.',
            'Close'
          )
        }, 2000)
      }
    }
  }

  public turnOnTelemetry() {
    Logger.debug(`[Extension.C4Model] turnOnTelemetry`)
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
      Logger.debug(`[Extension.C4Model] send telemetry`)
    } catch (e) {
      logError(e)
    }
  }
}

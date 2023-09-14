import type { ComputedView, DiagramView as LayoutedView, LikeC4Model, ViewID } from '@likec4/core'
import { invariant } from '@likec4/core'
import type { DotLayouter } from '@likec4/layouts'
import type TelemetryReporter from '@vscode/extension-telemetry'
import { equals } from 'rambdax'
import type * as vscode from 'vscode'
import type { MemoryStream } from 'xstream'
import xs from 'xstream'
import debounce from 'xstream/extra/debounce'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Logger, logError } from '../logger'
import { disposable, disposeAll } from '../util'
import type { Rpc } from './Rpc'

function isNotNullish<T>(x: T): x is NonNullable<T> {
  return x !== undefined && x !== null
}

const StateKeyLikeC4Model = 'c4model:last:views'

export class C4Model implements vscode.Disposable {
  #activeSubscription: vscode.Disposable | null = null

  #lastKnownModel: LikeC4Model | null = null

  private _disposables: vscode.Disposable[] = []

  private changesStream: MemoryStream<number>

  constructor(
    private context: vscode.ExtensionContext,
    private telemetry: TelemetryReporter,
    private rpc: Rpc,
    private dot: DotLayouter
  ) {
    this.changesStream = xs.createWithMemory<number>({
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
        listener.next(changes++)
      },
      stop: () => {
        Logger.info('[Extension.C4Model.changesStream] stop')
        this.#activeSubscription?.dispose()
        this.#activeSubscription = null
      }
    })

    if (telemetry.telemetryLevel === 'all') {
      this._disposables.push(this.subscribeForTelemetry())
    }

    Logger.info(`[Extension.C4Model] created`)
  }

  dispose() {
    Logger.info(`[Extension.C4Model] dispose`)
    disposeAll(this._disposables)
    this.#activeSubscription?.dispose()
  }

  // private persistToWorkspaceState = debounceFn((model: LikeC4RawModel) => {
  //   if (equals(this.#lastKnownModel, model)) {
  //     Logger.debug('[Extension.C4Model.fetchModel] skip persisting to workspaceState')
  //     return
  //   }
  //   this.#lastKnownModel = model
  //   this.context.workspaceState.update(StateKeyLikeC4Model, model).then(
  //     () => Logger.debug('[Extension.C4Model.fetchModel] persist to workspaceState'),
  //     err => logError(err)
  //   )
  // }, 5000)

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
    return xs
      .fromPromise(this.rpc.computeView(viewId))
      .filter(isNotNullish)
      .replaceError(err => {
        logError(err)
        return xs.empty()
      })
  }

  private layoutView(view: ComputedView) {
    // this.logger.logDebug(`layoutView: ${view.id}`)
    return xs.fromPromise(this.dot.layout(view)).replaceError(err => {
      logError(err)
      return xs.empty()
    })
  }

  public subscribeToView(viewId: ViewID, callback: (diagram: LayoutedView) => void) {
    Logger.info(`[Extension.C4Model.subscribe] >> ${viewId}`)
    const subscription = this.changesStream
      .compose(debounce(200))
      .map(() => this.fetchView(viewId))
      .flatten()
      .compose(dropRepeats<ComputedView>(equals))
      .map(view => this.layoutView(view))
      .flatten()
      .subscribe({
        next: diagram => {
          callback(diagram)
        },
        error: err => {
          logError(err)
        }
      })

    return disposable(() => {
      Logger.info(`[Extension.C4Model.unsubscribe] -- ${viewId}`)
      subscription.unsubscribe()
    })
  }

  private subscribeForTelemetry() {
    const fetchModel = xs
      .periodic(5 * 60 * 1000)
      .map(() => this.fetchModel())
      .flatten()
      .subscribe({
        next: model => {
          this.telemetry.sendTelemetryEvent(
            'fetchModel',
            {},
            {
              elements: Object.keys(model.elements).length,
              relationships: Object.keys(model.relations).length,
              views: Object.keys(model.views).length
            }
          )
        },
        error: err => {
          logError(err)
        }
      })
    return disposable(() => fetchModel.unsubscribe())
  }
}

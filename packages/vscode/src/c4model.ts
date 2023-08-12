import type { LanguageClient, LayoutFn, Logger } from 'src/di'
import { di } from 'src/di'
import { ADisposable, disponsable, queueMicrotask } from 'src/util'
import { Rpc } from './protocol'
import type { ComputedView, ViewID, DiagramView as LayoutedView } from '@likec4/core/types'
import { equals } from 'rambdax'
import { tokens } from 'typed-inject'
import xs, { type Subscription } from 'xstream'
import debounce from 'xstream/extra/debounce'
import dropRepeats from 'xstream/extra/dropRepeats'
import type * as vscode from 'vscode'

function isNotNullish<T>(x: T): x is NonNullable<T> {
  return x !== undefined && x !== null
}

export class C4ModelImpl extends ADisposable {
  private onDidChangeSubscription: vscode.Disposable | null = null

  static inject = tokens(di.client, di.layout, di.logger)
  constructor(private client: LanguageClient, private layout: LayoutFn, protected logger: Logger) {
    super()
    this._register(
      disponsable(() => {
        this.onDidChangeSubscription?.dispose()
      })
    )
  }

  private modelStream = xs
    .create<number>({
      start: listener => {
        if (this.onDidChangeSubscription) {
          throw new Error('modelStream already started')
        }
        this.logger.logDebug('++subscribe: onDidChangeModel')
        this.onDidChangeSubscription = this.client.onNotification(Rpc.onDidChangeModel, () => {
          this.logger.logDebug('receive: onDidChangeModel')
          listener.next(0)
        })
      },
      stop: () => {
        this.logger.logDebug('--unsubscribe: onDidChangeModel')
        // this.computedViews.clear()
        this.onDidChangeSubscription?.dispose()
        this.onDidChangeSubscription = null
      }
    })
    .startWith(0)
    .compose(debounce(200))
    .map(() => this.fetchModel())
    .flatten()
    .remember()

  public fetchModel() {
    this.logger.logDebug('fetchModel')
    return xs
      .fromPromise(this.client.sendRequest(Rpc.fetchModel))
      .map(s => s.model)
      .filter(isNotNullish)
      .replaceError(err => {
        this.logger.logError(err)
        return xs.empty()
      })
  }

  private layoutView(view: ComputedView) {
    this.logger.logDebug(`layoutView: ${view.id}`)
    return xs
      .fromPromise(this.layout(view))
      .replaceError(err => {
        this.logger.logError(err)
        return xs.empty()
      })
  }

  public subscribeToView(viewId: ViewID, callback: (diagram: LayoutedView) => void) {
    this.logger.logDebug(`subscribeToView: ${viewId}`)
    let subscription = this.modelStream
      .map(({ views }) => (viewId in views ? views[viewId] : null))
      .filter(isNotNullish)
      .compose(dropRepeats<ComputedView>(equals))
      .map(view => this.layoutView(view))
      .flatten()
      .subscribe({
        next: diagram => {
          callback(diagram)
        },
        error: err => {
          this.logger.logError(err)
        }
      }) as (Subscription | null)

    return this._register(
      disponsable(() => {
        queueMicrotask(() => {
          this.logger.logDebug(`--unsubscribe: ${viewId}`)
          subscription?.unsubscribe()
          subscription = null
        })
      })
    )
  }
}

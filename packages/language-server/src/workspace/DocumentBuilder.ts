import { invariant } from '@likec4/core'
import {
  type AstNodeDescription,
  type LangiumDocument,
  DefaultDocumentBuilder,
  Disposable,
  DocumentState,
  MultiMap,
} from 'langium'
import type { URI } from 'langium'
import { type LikeC4LangiumDocument, isLikeC4LangiumDocument } from '../ast'
import { serverLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'

type DocumentStateReset = Exclude<DocumentState, DocumentState.Validated>

export type DocumentStateResetListener = (params: {
  doc: LikeC4LangiumDocument
  /**
   * State the document is being reset to
   */
  resetTo: DocumentStateReset
  /**
   * State the document was in before reset
   */
  previous: Exclude<DocumentState, DocumentState.Changed>
}) => void

export class LikeC4DocumentBuilder extends DefaultDocumentBuilder {
  #logger = serverLogger.getChild('document-builder')

  protected readonly stateResetListeners = new MultiMap<
    Exclude<DocumentState, DocumentState.Changed>,
    DocumentStateResetListener
  >()

  constructor(protected services: LikeC4SharedServices) {
    super(services)
  }

  /**
   * Subscribe to document state reset events
   * (when document state is at least the specified state, and reset below occurs)
   *
   * @param listenerState - State reset you want to be notified about
   * @param callback - Function to call when document is reset to this state
   * @returns Disposable to unsubscribe
   */
  onDocumentResetBelow(
    wasOnOrAbove: Exclude<DocumentState, DocumentState.Changed>,
    callback: DocumentStateResetListener,
  ): Disposable {
    this.stateResetListeners.add(wasOnOrAbove, callback)
    return Disposable.create(
      () => this.stateResetListeners.delete(wasOnOrAbove, callback),
    )
  }

  protected notifyStateResetListeners(
    listenerState: Exclude<DocumentState, DocumentState.Changed>,
    params: Parameters<DocumentStateResetListener>[0],
  ): void {
    if (this.stateResetListeners.has(listenerState)) {
      this.stateResetListeners.get(listenerState).forEach(callback => callback(params))
    }
  }

  #resetInProgress: false | URI = false
  override resetToState(doc: LangiumDocument, resetTo: DocumentState): void {
    // Must not be in reset progress
    invariant(!this.#resetInProgress, `received resetToState while rese of ${this.#resetInProgress} is in progress`)

    this.#resetInProgress = doc.uri

    // Remember current state
    const previousState = doc.state as Exclude<DocumentState, DocumentState.Changed>

    // Reset to target state first
    super.resetToState(doc, resetTo)

    try {
      // Only notify if:
      // - resetTo is below current state (actually resetting)
      // - document is a LikeC4 document
      if (resetTo < previousState && isLikeC4LangiumDocument(doc)) {
        const params: Parameters<DocumentStateResetListener>[0] = {
          doc: doc,
          resetTo: resetTo as DocumentStateReset,
          previous: previousState,
        }
        // We notify listeners for each phase we're resetting backward
        for (let notifyState = previousState - 1; notifyState >= resetTo; notifyState--) {
          invariant(notifyState >= 0, 'notifyState must not be negative')
          try {
            this.notifyStateResetListeners(notifyState, params)
          } catch (error) {
            this.#logger.error('Error notifying state reset listener for state {notifyState}', {
              notifyState,
              error,
            })
          }
        }
      }
    } finally {
      this.#resetInProgress = false
    }
  }
}
